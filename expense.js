const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pgp = require('pg-promise')();
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const config = require('./config/config.js');

const db = pgp(config.db);

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use('/', express.static(__dirname + '/public'));

//====================================================//
//                                                    //
//        API for user to create a new account        //
//                                                    //
// ===================================================//

app.post('/api/user/signup', (req,resp,next) => {
  //sign up needs to be sent an object {email, firstName, lastName, password}. It will return the users authentication token.
  let user = req.body;
  let password = req.body.password;

  let DEFAULT_SUBCATEGORIES = { 1: ['Groceries', 'Restaurants'],
                                2: ['Electric', 'Gas', 'Water'],
                                3: ['Rent', 'HOA Dues'],
                                4: ['Charitable','Church'],
                                5: ['Gasoline', 'Repairs'],
                                6: ['Homeowners','Taxes', 'Medical'],
                                7: ['Mortgage','Automobile','Student']
                              };


  bcrypt.hash(password, 10) //create has with 10 passes
  .then(encryptedPassword =>  {

    // console.log('creating user: ', user);
    return db.one(`insert into users (id, firstname, lastname, email, password)
                  values (default, $1, $2, $3, $4) returning id`,
                  [user.firstName, user.lastName, user.email.toLowerCase(), encryptedPassword]); //add the user information for the new user and return the id
    }

  )
  .then(results => { //create an auth token for the new user and add to the tokens table
      let token = uuid.v4();
      // console.log('user_id: ', results.id);
      // console.log("token is: ", token);
      return Promise.all([results.id, db.one(`insert into tokens (userid, token) VALUES ($1, $2) returning token`, [results.id, token])]);

  })
  .then(([id, results]) => { //respond to the POST request with the auth token
    resp.json({token: results.token});
    return id;
  })
  .then((id) => { //add the default subcategories for the new user
    let arrPromises = [];
    Object.keys(DEFAULT_SUBCATEGORIES).forEach(key => {
        DEFAULT_SUBCATEGORIES[key].forEach( subcategory => {
          arrPromises.push(db.any(`insert into subcategories (id, userid, category, subcategory, amount)
                                  VALUES (default, $1, $2, $3, $4)`, [id, key, subcategory, 0]));
        });

      });

    return Promise.all(arrPromises);

    })
  .catch(err => {
       if (err.message === 'duplicate key value violates unique constraint "users_email_key"'){
         resp.status(409);
         resp.json({message: 'email already exists'});
       } else {
         console.log("unknown error: ", err);
         throw err;
       }

  })

  .catch(next);

});

//====================================================//
//                                                    //
//        API for user to login                       //
//                                                    //
// ===================================================//


// this api needs an object passed with {email, password}

app.post('/api/user/login', (req, resp, next) => {

  let password = req.body.password;
  // console.log('req-body: ', req.body);
  db.one(`select id, password as encryptedpassword, email, firstname, lastname  FROM users WHERE email ilike $1`, req.body.email) //return one user with matching email
  .then(results => {
    // console.log("results: ", results);
    return Promise.all([results, bcrypt.compare(password, results.encryptedpassword)]) // compare the supplied password and the encrypted password
    })
  .then(([results, matched]) => {
    // console.log('matched: ', matched);
    if (matched) {
      let token = uuid.v4();
      let loginData = {firstName: results.firstname, lastName: results.lastname, token: token, email: results.email };
       return Promise.all([loginData, db.none(`insert into tokens (userid, token) VALUES ($1, $2)`, [results.id, token])]);

    } else if (!matched){
      let errMessage = {message: 'password is incorrect'};
      throw errMessage;
    }

  })
  .then(([loginData, results ]) => resp.json(loginData)) // the password is correct, return the user information
  .catch(err => {
    console.log('handing error during login: ', err);
    if (err.message === 'No data returned from the query.') { //this is typically when the email address was not found
      let errMessage = {message: 'login failed'};
      resp.status(401);
      resp.json(errMessage);
    } else if (err.message === 'password is incorrect') {
      let errMessage = {message: 'login failed'};
      resp.status(401);
      resp.json(errMessage);
    } else {
      console.log("something bad happened");
      throw err;
     }
  })
  .catch(next);
});


//====================================================//
//                                                    //
//    API for user to retrieve home page expenses     //
//                                                    //
// ===================================================//

app.post('/api/expenses', (req, resp, next) => {
  // console.log("I see the request");
  // console.log("req: ", req.body);
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {

    return Promise.all([objId.userid, db.any('select id, category from categories')]);
  })
  .then(([userid, objCategories]) => {  // takes in the userid and an object with all the main categories. Creates a blank Data object with categories and their ids

      let objData ={}
      objCategories.forEach(item => {
        objData[item.category]={};  //create a blank object for each category.
        objData[item.category]['id']=item.id;   // sets the id for that category.
        objData[item.category]['monthlyBudget']=0; // sets the monthly budget for that category to 0.
        objData[item.category]['spent']=0;  // sets the spent amount to 0.
        objData[item.category]['subcategories']={}; //creates a blank object for the subcategories value for this category.
        });

        let nextQuery = db.any(`select categories.id as catid, subcategories.id as subid, subcategories.subcategory, amount
                                from subcategories join categories on subcategories.category = categories.id
                                where userid = $1`, [userid]);

        return Promise.all([userid, objData, nextQuery]);
  })
  .then(([userid, objData, results]) => {  // Takes in the userid, Data object, and results from the last query. Updates the Data object to include all subcategories for
                                          // this user with the subcategory id and monthlyBudget allocation.

    results.forEach(itemA => {
     Object.keys(objData).forEach( key => {
       if (objData[key].id === itemA.catid){
           objData[key].subcategories[itemA.subcategory] = {id: itemA.subid, monthlyBudget: itemA.amount, spent: 0};
         }
       })
    });

    return Promise.all([userid, objData]);

  })
  .then(([userid, objData]) => { // Takes in the userid and Data object. Generates a DB query of the monthly budget for each category.
      let nextQuery = db.any('select category, coalesce(sum(amount),0) as amount from subcategories where userid = $1 group by category', [userid]);
      return Promise.all([userid, objData, nextQuery]);
  })
  .then(([userid, objData, results]) => { // Takes in the userid, Data object, and results from last query.
                                          // Updates the Data object with the monthly budget allotment for each category

       results.forEach(itemA => {
        Object.keys(objData).forEach( key => {
          if (objData[key].id === itemA.category){
              objData[key].monthlyBudget = itemA.amount;
            }
        })
      });

      let nextQuery ='';
      if (req.body.timeFrame === 'thismonth') {

            nextQuery = db.any(`select categories.id as catid, coalesce(sum(expenses.amount),0) as amount
                                from expenses left join users on expenses.userid = users.id join subcategories on expenses.subcategory = subcategories.id
                                join categories on subcategories.category= categories.id
                                where users.id = $1 and date > date_trunc('month', current_date) group by categories.id`, [userid]);

      } else if (req.body.timeFrame === 'prior30days') {

            nextQuery = db.any(`select categories.id as catid, coalesce(sum(expenses.amount),0) as amount
                                from expenses left join users on expenses.userid = users.id join subcategories on expenses.subcategory = subcategories.id
                                join categories on subcategories.category= categories.id
                                where users.id = $1 and (current_date - date) < 30 group by categories.id`, [userid]);

      }
      return Promise.all([userid, objData, nextQuery]);

  })
  .then(([userid, objData, results]) => {

    // console.log('results: ', results);
    results.forEach(itemA => {
        // console.log("============================");
        // console.log('itemA: ',itemA);
        Object.keys(objData).forEach(category => {
            // console.log('\tcategory: ', category, '  id: ', objData[category].id);

                if (objData[category].id === itemA.catid){
                  // console.log('\t\tfound a match');
                  objData[category].spent = itemA.amount;
                }
          });
        })


    let nextQuery ='';
    if (req.body.timeFrame === 'thismonth') {

          nextQuery = db.any(`select subcategories.id as subcatid, coalesce(sum(expenses.amount),0) as amount
                              from expenses left join users on expenses.userid = users.id
                              join subcategories on expenses.subcategory = subcategories.id
                              where users.id = $1 and date > date_trunc('month', current_date) group by subcategories.id`, [userid]);


    } else if (req.body.timeFrame === 'prior30days') {

          nextQuery = db.any(`select subcategories.id as subcatid, coalesce(sum(expenses.amount),0) as amount
                              from expenses left join users on expenses.userid = users.id
                              join subcategories on expenses.subcategory = subcategories.id
                              where users.id = $1 and (current_date - date) < 30 group by subcategories.id`, [userid]);

    }

    return Promise.all([userid, objData, nextQuery]);

  })
  .then(([userid, objData, results]) => {
    // console.log('results: ', results)

    results.forEach(itemA => {
        // console.log("============================");
        // console.log('itemA: ',itemA);
        Object.keys(objData).forEach(category => {
            // console.log('\tcategory: ', category, '  id: ', objData[category].id);
            Object.keys(objData[category].subcategories).forEach( subcategory => {
              // console.log('\t\tsubcategory: ', objData[category].subcategories[subcategory]);
            if (objData[category].subcategories[subcategory].id === itemA.subcatid){
              // console.log('\t\t\tfound a match');
              objData[category].subcategories[subcategory].spent = itemA.amount;
            }
          })
        })
    })

    return objData;

  })
  .then((val) => resp.json(val))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});

//====================================================//
//                      Version 2                     //
//    API for user to retrieve home page expenses     //
//                                                    //
// ===================================================//

app.post('/api/expenses2', (req, resp, next) => {
  // console.log("I see the request");
  // console.log("req: ", req.body);
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {

    return Promise.all([objId.userid, db.any('select id, category from categories')]);
  })
  .then(([userid, objCategories]) => {  // takes in the userid and an object with all the main categories. Creates a blank Data object with categories and their ids

      let objData = [];
      objCategories.forEach(item => {
        let objCategory = {};
        objCategory[item.category]={};  //create a blank object for each category.
        objCategory[item.category]['id']=item.id;   // sets the id for that category.
        objCategory[item.category]['monthlyBudget']=0; // sets the monthly budget for that category to 0.
        objCategory[item.category]['spent']=0;  // sets the spent amount to 0.
        objCategory[item.category]['subcategories']=[]; //creates a blank object for the subcategories value for this category.
        objData.push(objCategory);
        });
        // console.log('objData: ', objData);
        // console.log("------------");
        let nextQuery = db.any(`select categories.id as catid, subcategories.id as subid, subcategories.subcategory, amount
                                from subcategories join categories on subcategories.category = categories.id
                                where userid = $1`, [userid]);

        return Promise.all([userid, objData, nextQuery]);
  })
  .then(([userid, objData, results]) => {  // Takes in the userid, Data object, and results from the last query. Updates the Data object to include all subcategories for
                                          // this user with the subcategory id and monthlyBudget allocation.

    results.forEach(itemA => {
     objData.forEach( ( objCategory, index ) => {
      //  console.log('objCategory: ', objCategory);
       let category = Object.keys(objCategory)[0];
      //  console.log('category: ', category);
       if (objCategory[category].id === itemA.catid){
        //  console.log('test: ', objData[category]);
           objData[index][category].subcategories.push({[itemA.subcategory]: {id: itemA.subid, monthlyBudget: itemA.amount, spent: 0}});
         }
       })
    });

    // console.log('step2: ', JSON.stringify(objData));
    // console.log('++++++++++++++++++++');
    return Promise.all([userid, objData]);

  })
  .then(([userid, objData]) => { // Takes in the userid and Data object. Generates a DB query of the monthly budget for each category.
      let nextQuery = db.any('select category, coalesce(sum(amount),0) as amount from subcategories where userid = $1 group by category', [userid]);
      return Promise.all([userid, objData, nextQuery]);
  })
  .then(([userid, objData, results]) => { // Takes in the userid, Data object, and results from last query.
                                          // Updates the Data object with the monthly budget allotment for each category

       results.forEach(itemA => {
        //  console.log('itemA: ', itemA);
        //  console.log('itemA category: ', itemA.category);
        objData.forEach( (objCategory, index) => {

          let category = Object.keys(objCategory)[0];
          // console.log('objCategory.id: ', objCategory[category].id);
          if (objCategory[category].id === itemA.category){
              objData[index][category].monthlyBudget = itemA.amount;
            }
        })
      });
      // console.log('step3: ', JSON.stringify(objData));
      // console.log('====================');
      let nextQuery ='';
      if (req.body.timeFrame === 'thismonth') {

            nextQuery = db.any(`select categories.id as catid, coalesce(sum(expenses.amount),0) as amount
                                from expenses left join users on expenses.userid = users.id join subcategories on expenses.subcategory = subcategories.id
                                join categories on subcategories.category= categories.id
                                where users.id = $1 and date > date_trunc('month', current_date) group by categories.id`, [userid]);

      } else if (req.body.timeFrame === 'prior30days') {

            nextQuery = db.any(`select categories.id as catid, coalesce(sum(expenses.amount),0) as amount
                                from expenses left join users on expenses.userid = users.id join subcategories on expenses.subcategory = subcategories.id
                                join categories on subcategories.category= categories.id
                                where users.id = $1 and (current_date - date) < 30 group by categories.id`, [userid]);

      }
      return Promise.all([userid, objData, nextQuery]);

  })
  .then(([userid, objData, results]) => {

    results.forEach(itemA => {

        objData.forEach((objCategory, index) => {
            let category = Object.keys(objCategory)[0];
            if (objCategory[category].id  === itemA.catid){
              objData[index][category].spent = itemA.amount;
            }
          });
        })

    // console.log("step4: ", JSON.stringify(objData));
    // console.log("\\\\\\\\\\\\\\\\\\\\");

    let nextQuery ='';
    if (req.body.timeFrame === 'thismonth') {

          nextQuery = db.any(`select subcategories.id as subcatid, coalesce(sum(expenses.amount),0) as amount
                              from expenses left join users on expenses.userid = users.id
                              join subcategories on expenses.subcategory = subcategories.id
                              where users.id = $1 and date > date_trunc('month', current_date) group by subcategories.id`, [userid]);


    } else if (req.body.timeFrame === 'prior30days') {

          nextQuery = db.any(`select subcategories.id as subcatid, coalesce(sum(expenses.amount),0) as amount
                              from expenses left join users on expenses.userid = users.id
                              join subcategories on expenses.subcategory = subcategories.id
                              where users.id = $1 and (current_date - date) < 30 group by subcategories.id`, [userid]);

    }

    return Promise.all([userid, objData, nextQuery]);

  })
  .then(([userid, objData, results]) => {

    results.forEach(itemA => {
        // console.log("============================");
        // console.log('itemA: ',itemA);
        objData.forEach((objCategory, index1) => {
            // console.log('\tobjCategory: ', objCategory);
            let category = Object.keys(objCategory)[0];
            // console.log('\t\tsubCats: ', objCategory[category].subcategories);
            objCategory[category].subcategories.forEach( (objSubcategory, index2 ) => {
              let subCategory = Object.keys(objSubcategory)[0];
              // console.log('\t\tsubcategory: ', objData[category].subcategories[subcategory]);
            if (objData[index1][category].subcategories[index2][subCategory].id === itemA.subcatid){
              // console.log('\t\t\tfound a match');
              objData[index1][category].subcategories[index2][subCategory].spent = itemA.amount;
            }
          })
        })
    })

    return objData;

  })
  .then((val) => resp.json(val))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});

//====================================================//
//                                                    //
//    API for user to add a new subcategory           //
//                                                    //
// ===================================================//

app.post('/api/addnewsubcategory', (req, resp, next) => {
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {
    return Promise.all([objId, db.one('select id as categoryid from categories where category = $1', [req.body.categoryName])]);
  })
  .then(([objId, results]) => {
    let categoryid = results.categoryid;
    let subcategory = req.body.subcategory;
    let amount = req.body.amount;

    return Promise.all([objId.userid, db.any('insert into subcategories (id, userid, category, subcategory, amount) values (default, $1, $2, $3, $4)',[objId.userid, categoryid, subcategory, amount])]);
  })
  .then(() => resp.json({message: 'new category created'}))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});


//====================================================//
//                                                    //
//    API for user to add a new transaction           //
//                                                    //
// ===================================================//

app.post('/api/addnewtransaction', (req, resp, next) => {
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {
    let userid = objId.userid;
    let subcategoryid = req.body.subcategoryid;
    let amount = req.body.amount;
    let description = req.body.description;
    let address = req.body.address;
    let date = req.body.date;
    let type = req.body.type;

    return db.any('insert into expenses (id, amount, subcategory, userid, description, address, date, type ) values (default, $1, $2, $3, $4, $5, $6, $7)',
                  [amount, subcategoryid, userid, description, address, date, type]);
  })
  .then(() => resp.json({message: 'new transaction created'}))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});

//====================================================//
//                                                    //
//    API for save monthly expense budget settings    //
//                                                    //
// ===================================================//

app.post('/api/saveexpenses', (req, resp, next) => {
  // console.log("req: ", req.body);
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {
    let arrSQLUpdatePromises = [];
    let expenses = req.body.expenses;
    // console.log("expenses: ", expenses);
    expenses.forEach(category => {
      let categoryName = Object.keys(category)[0];
      let tmpcategory = category;
      // console.log("processing category: ", categoryName);
      // console.log("category: ", category);
      category[categoryName].subcategories.forEach(objSubcategory => {
        // console.log("objSubcategory: ", objSubcategory);
        let userid = objId.userid;
        let subcategoryName = Object.keys(objSubcategory)[0];
        let amount = objSubcategory[subcategoryName].monthlyBudget;
        let category = tmpcategory[categoryName].id;

        arrSQLUpdatePromises.push(db.any('update subcategories set amount = $1 where userid = $2 and category = $3 and subcategory = $4', [amount, userid, category, subcategoryName]));
      });

    });
    return Promise.all(arrSQLUpdatePromises);
  })
  .then(() => resp.json({message: 'settings saved'}))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});

//====================================================//
//                                                    //
//    API for retrieving subcategory transactions     //
//                                                    //
// ===================================================//

app.post('/api/subcategorytransactions', (req, resp, next) => {
  // console.log("req: ", req.body);
  db.one(`select userid FROM tokens WHERE token = $1`, req.body.token) // first see if the user token maps to a user, if not the user is not authenticated
  .then(objId => {

      let userid = objId.userid;
      let subcategoryname = req.body.subcategoryname;
      let subcategoryid = req.body.subcategoryid;

      return db.any(`select * from expenses where userid = $1 and subcategory = $2 and date > date_trunc('month', current_date) `, [userid, subcategoryid, ] );

  })
  .then((results) => resp.json(results))
  .catch( err => {
      console.log('error message: ', err);
      if (err.message = 'No data returned from the query.'){
        let errMessage = {message: 'user not authenticated'};
        resp.status(401);
        resp.json(errMessage);
      } else {
        throw err;
      }
  })
  .catch(next);
});

app.use((err, req, resp, next) => {
  console.log("error: ", err.message);
  resp.status(500);
  resp.json({
    error: err.message,
    stack: err.stack.split('\n')
  });
});



app.listen(5007, () => {
  console.log('Listening on port 5007');
});
