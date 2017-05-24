--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.2
-- Dumped by pg_dump version 9.6.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: todd
--

CREATE TABLE categories (
    id integer NOT NULL,
    category character varying
);


ALTER TABLE categories OWNER TO todd;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: todd
--

CREATE SEQUENCE categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE categories_id_seq OWNER TO todd;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: todd
--

ALTER SEQUENCE categories_id_seq OWNED BY categories.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: todd
--

CREATE TABLE expenses (
    id integer NOT NULL,
    amount numeric(8,2),
    subcategory integer,
    userid integer,
    description character varying,
    address character varying,
    date date DEFAULT now(),
    type character varying
);


ALTER TABLE expenses OWNER TO todd;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: todd
--

CREATE SEQUENCE expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE expenses_id_seq OWNER TO todd;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: todd
--

ALTER SEQUENCE expenses_id_seq OWNED BY expenses.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: todd
--

CREATE TABLE subcategories (
    id integer NOT NULL,
    userid integer,
    category integer,
    subcategory character varying,
    amount numeric(8,2)
);


ALTER TABLE subcategories OWNER TO todd;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: todd
--

CREATE SEQUENCE subcategories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE subcategories_id_seq OWNER TO todd;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: todd
--

ALTER SEQUENCE subcategories_id_seq OWNED BY subcategories.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: todd
--

CREATE TABLE tokens (
    id integer NOT NULL,
    userid integer,
    token text
);


ALTER TABLE tokens OWNER TO todd;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: todd
--

CREATE SEQUENCE tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tokens_id_seq OWNER TO todd;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: todd
--

ALTER SEQUENCE tokens_id_seq OWNED BY tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: todd
--

CREATE TABLE users (
    id integer NOT NULL,
    firstname character varying,
    lastname character varying,
    email character varying,
    password text
);


ALTER TABLE users OWNER TO todd;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: todd
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_id_seq OWNER TO todd;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: todd
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: todd
--

ALTER TABLE ONLY categories ALTER COLUMN id SET DEFAULT nextval('categories_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: todd
--

ALTER TABLE ONLY expenses ALTER COLUMN id SET DEFAULT nextval('expenses_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: todd
--

ALTER TABLE ONLY subcategories ALTER COLUMN id SET DEFAULT nextval('subcategories_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: todd
--

ALTER TABLE ONLY tokens ALTER COLUMN id SET DEFAULT nextval('tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: todd
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: todd
--

COPY categories (id, category) FROM stdin;
1	Food
2	Utilities
3	Housing
4	Giving
5	Transportation
6	Insurance and Taxes
7	Loans
8	Miscellaneous
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: todd
--

SELECT pg_catalog.setval('categories_id_seq', 8, true);


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: todd
--

COPY expenses (id, amount, subcategory, userid, description, address, date, type) FROM stdin;
1	12.50	2	1	Kroger	3330 Piedmont Rd NE, Atlanta, GA 30305	2017-05-11	2
2	8.72	3	1	NaanStop	3420 Piedmont Rd NE, Atlanta, GA 30305	2017-05-09	2
4	45.12	5	1	GasSouth	\N	2017-05-05	1
5	800.00	4	1	Wonderlodge Apartments	1280 Peachtree St NE, Atlanta, GA 30309	2017-05-01	2
8	67.42	10	2	Lawn Service	\N	2017-05-06	1
10	21.19	9	2	QuikTrip	3110 Roswell Rd, Marietta, GA 30062	2017-05-14	2
3	34.82	12	1	QuikTrip	761 Sidney Marcus Blvd NE, Atlanta, GA 30324	2017-05-15	2
9	125.17	13	2	Cobb EMC	\N	2017-05-11	1
7	27.59	7	2	Chili's	4111 Roswell Rd, Marietta, GA 30062	2017-05-10	2
6	13.98	8	2	Kroger	2100 Roswell Rd #2140, Marietta, GA 30062	2017-05-09	2
11	32.00	11	2	Princeton Mill HOA	\N	2017-04-30	1
\.


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: todd
--

SELECT pg_catalog.setval('expenses_id_seq', 11, true);


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: todd
--

COPY subcategories (id, userid, category, subcategory, amount) FROM stdin;
3	1	1	Restaurants	175.00
2	1	1	Groceries	350.00
6	1	2	Electric	110.00
4	1	3	Rent	850.00
5	1	2	Gas	85.00
7	2	1	Restaurants	500.00
8	2	1	Groceries	450.00
10	2	8	Lawn care	180.00
11	2	3	HOA Dues	33.00
12	1	5	Gasoline	80.00
9	2	5	Gasoline	115.00
13	2	2	Gas	95.00
16	12	1	Groceries	0.00
17	12	1	Restaurants	0.00
18	12	2	Electric	0.00
19	12	2	Gas	0.00
20	12	2	Water	0.00
21	12	3	Rent	0.00
22	12	3	HOA Dues	0.00
23	12	5	Gasoline	0.00
24	12	4	Charitable	0.00
25	12	4	Church	0.00
26	12	5	Repairs	0.00
27	12	6	Medical	0.00
28	12	6	Taxes	0.00
29	12	6	Homeowners	0.00
30	12	7	Mortgage	0.00
31	12	7	Automobile	0.00
\.


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: todd
--

SELECT pg_catalog.setval('subcategories_id_seq', 83, true);


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: todd
--

COPY tokens (id, userid, token) FROM stdin;
1	2	d033549a-b58c-4625-9d78-61d1b8212145
2	1	fbb23d2b-dd08-4e47-8949-0833904d88d7
7	11	32cd3adb-869a-49fe-917f-be3e3402306f
8	11	cdd9d954-da0b-4da1-a682-01b4eac00ee6
9	11	9db823fa-3e1f-42cf-b2a1-60122104536f
10	11	48d2fee8-4b79-4ef5-a06a-20f60f268083
11	11	51d16c19-af15-4e7a-acc6-bf81d7169ce9
12	11	9ec585ef-28f4-4340-9d97-90f7837d4bd7
13	11	d0f5bce0-0b5d-4f13-ba53-bd6632658adf
14	12	7199beff-0db8-49d0-9601-9c7b21384335
15	2	06ec81e7-acb5-4808-8b7c-67c4579d3623
16	2	206aea81-a687-4349-9268-951980746f42
17	2	b0e7ff85-d2fb-4336-a9c8-f7f419ee3658
18	2	7834c398-7667-473c-b627-76c0e137f69b
19	2	b9e9ada3-c06e-4317-ad8e-ee782660d9e5
20	2	458db6d8-ac6d-4315-b8bf-ca99c0e00073
21	2	01fe5894-8977-4e81-85c2-03be0e7f30fe
22	2	ab3b6b31-98b7-4203-a13b-2458e03f9ef6
23	2	ce7f7954-5aac-4904-bb1e-092d2862217b
24	2	0e5de4da-ea9f-4c8d-8b9d-8dc121eeba94
25	2	f273b4f6-4c27-4cfe-969b-842404e1ee0b
26	2	29aa3a7f-e65c-47f6-acfd-595f361116b1
27	2	ee210cf8-30f6-493f-9c3f-ad4cb2a98058
28	2	b8f1284d-27c2-4bfe-b484-273ad7c5af06
29	2	6730d530-f6d8-46b1-9c50-da7e6f2aa1f0
30	2	d0bb2caf-dfca-45e1-888e-1dac448307dd
31	2	9f612148-bef6-4404-94ed-0c7ab8d19d02
32	2	73b6e7ce-5a7f-4810-9038-b596212c209a
33	2	63f4b674-e1d3-4fdd-8e24-07efc9334a45
34	2	5f2ab720-065f-4f50-a528-aebe426092ed
35	2	a8643890-153e-45a2-b75d-b061fd101e21
36	2	0e36f971-48ce-4a10-bc0f-8a0af2216cae
37	2	09af41c7-3b73-4967-a629-ac3560e8b0f1
38	2	641133fa-b619-43b7-b994-a191575ce358
39	2	4a6c674c-d47b-4419-aba9-b7d7579cbf35
40	2	37e27d1a-f5d5-49ac-ad8b-db52fa48b444
41	2	82c0a051-52fd-4814-884e-de8112aa399f
42	2	09b2c655-700c-4995-b220-eeb81397cc9e
43	2	41e8dc39-3c2c-4f76-913b-5f43fe99fb12
44	2	a0fa7450-0d78-4f99-8e0d-3f60b4148d4d
45	2	9615b15b-d04e-47dc-8dc3-69345f0e92d4
46	2	6001c9da-1bdf-4db6-9485-2c99426ba606
47	2	76db386d-1830-4a01-9eda-bc503ab3d7d2
48	2	44fb0d6f-bccc-4d81-b5b6-1778fb9b97e7
49	2	a14a4695-9713-4ed6-91b2-faa071149b22
50	1	773659b7-37f3-419d-98f8-719e5a473348
51	2	cab3f1c0-0508-4902-9638-a9355443fd69
52	1	93f6cf48-ee80-40b9-a448-186d79557829
54	2	2f380ada-66ff-48a6-bd73-7af338a360ff
57	2	8eb4310a-82ef-4082-a070-eccb1fe72ac1
58	2	b3931a0f-9728-49da-893d-cdd3751d7578
59	2	278f319d-ae2c-4c58-a53d-c0b4cdc5df6a
60	2	2d9a6f57-f975-438b-9961-c0c05d1b74da
61	2	d44df1a9-64d7-4911-8046-a7862977bae2
62	2	ca78029c-9042-4869-8ca1-666a96f36917
63	2	45cc9213-b528-47e1-a268-84e30da95419
64	2	35f03357-63d2-465d-bdd0-73203bbb52c6
65	2	4cb05290-c7fc-4a96-8ae0-40fcb4104907
66	1	4c578e2d-a1aa-44ba-9787-7870f8b67f77
67	1	a0416977-6e91-4a46-b15b-16ff77e07202
68	1	0ba95f30-0e45-4fcd-a907-8cc9fc6a72c6
69	1	7fd59d93-5a8f-4833-8f10-5e0cd9ca0f5b
70	1	d0f099e7-aa97-4e8b-b020-9537fcd895a0
71	1	70755087-d8fe-4827-a3d6-e4e7aea9c69b
72	1	96f5feaa-1cbd-479c-9f73-d68f6226b4ca
\.


--
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: todd
--

SELECT pg_catalog.setval('tokens_id_seq', 72, true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: todd
--

COPY users (id, firstname, lastname, email, password) FROM stdin;
1	Julie	Dyer	juliemdyer@gmail.com	$2a$10$QIELrJu/Mvl7JmmD9NpI9OrO3aNPAy.LmHXfqqhVHhJz2M4NI4L12
2	Todd	Briley	todd.briley@outlook.com	$2a$10$QIELrJu/Mvl7JmmD9NpI9OrO3aNPAy.LmHXfqqhVHhJz2M4NI4L12
11	Tom	Brady	tombrady@thecheaters.com	$2a$10$kRpHbrKOeN0ycLjjZxHuPuQT19Ee4a/HqW5M5sHXRdImPWTyBZoci
12	Tom	Elgar	tomElgar@bellsout.com	$2a$10$4p2.dzLlIfEH.b4czbCk2uc9PcQC8tNISrZTstLbIsUoVv6SG0sxC
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: todd
--

SELECT pg_catalog.setval('users_id_seq', 25, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_subcategory_fkey; Type: FK CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY expenses
    ADD CONSTRAINT expenses_subcategory_fkey FOREIGN KEY (subcategory) REFERENCES subcategories(id);


--
-- Name: expenses expenses_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY expenses
    ADD CONSTRAINT expenses_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);


--
-- Name: subcategories subcategories_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY subcategories
    ADD CONSTRAINT subcategories_category_fkey FOREIGN KEY (category) REFERENCES categories(id);


--
-- Name: subcategories subcategories_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY subcategories
    ADD CONSTRAINT subcategories_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);


--
-- Name: tokens tokens_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: todd
--

ALTER TABLE ONLY tokens
    ADD CONSTRAINT tokens_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);


--
-- PostgreSQL database dump complete
--

