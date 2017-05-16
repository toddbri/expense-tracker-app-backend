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

app.post('/api/expenses', (req, resp, next) => {

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
  .then(([userid, objData, results]) => { // Takes in the userid and Data object. Updates the Data object with

       results.forEach(itemA => {
        Object.keys(objData).forEach( key => {
          if (objData[key].id === itemA.category){
              objData[key].monthlyBudget = itemA.amount;
            }
        })
      });
      console.log('objData: ', objData);
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




app.use((err, req, resp, next) => {
  console.log("error: ", err.message);
  resp.status(500);
  resp.json({
    error: err.message,
    stack: err.stack.split('\n')
  });
});



app.listen(5000, () => {
  console.log('Listening on port 5000');
});
