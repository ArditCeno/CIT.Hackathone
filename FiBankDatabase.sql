--
-- PostgreSQL database dump
--

\restrict gF8ZJnXhRLcO7HVxGUctqRiknEbtKiAuCjUOI8eEfdmUdb1UtGIbegSkA7p8j5d

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-05-23 03:22:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16601)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    client_id character varying(100) NOT NULL,
    user_id integer,
    amount numeric(12,2),
    ip_address character varying(50),
    device_id character varying(100),
    "timestamp" timestamp without time zone,
    risk_score numeric(6,4),
    decision character varying(30),
    created_at timestamp without time zone
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16600)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 221
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 226 (class 1259 OID 16636)
-- Name: fraud_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fraud_alerts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    event_id integer,
    alert_type character varying(50),
    severity character varying(20),
    message text,
    is_read boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.fraud_alerts OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16635)
-- Name: fraud_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fraud_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fraud_alerts_id_seq OWNER TO postgres;

--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 225
-- Name: fraud_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fraud_alerts_id_seq OWNED BY public.fraud_alerts.id;


--
-- TOC entry 224 (class 1259 OID 16617)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    client_id character varying(100) NOT NULL,
    user_id integer,
    profile_data json,
    last_updated timestamp without time zone
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16616)
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profiles_id_seq OWNER TO postgres;

--
-- TOC entry 4971 (class 0 OID 0)
-- Dependencies: 223
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- TOC entry 228 (class 1259 OID 16658)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    event_id integer,
    tx_type character varying(30),
    recipient character varying(150),
    amount numeric(12,2),
    city character varying(80),
    device character varying(100),
    is_fraud boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16657)
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- TOC entry 4972 (class 0 OID 0)
-- Dependencies: 227
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- TOC entry 220 (class 1259 OID 16583)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20),
    full_name character varying(100),
    iban character varying(40),
    balance numeric(12,2),
    is_active boolean,
    created_at timestamp without time zone,
    pin_hash text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16582)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4776 (class 2604 OID 16604)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 4778 (class 2604 OID 16639)
-- Name: fraud_alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_alerts ALTER COLUMN id SET DEFAULT nextval('public.fraud_alerts_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16620)
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- TOC entry 4779 (class 2604 OID 16661)
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- TOC entry 4775 (class 2604 OID 16586)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4957 (class 0 OID 16601)
-- Dependencies: 222
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, event_type, client_id, user_id, amount, ip_address, device_id, "timestamp", risk_score, decision, created_at) FROM stdin;
1	transaction	arjola	2	1800.00	46.99.201.100	Mobile_Android	2026-05-20 00:44:08.306418	0.8800	BLOCK	2026-05-23 00:44:09.443179
2	login	arjola	2	\N	89.96.123.45	Desktop_Windows	2026-05-22 00:44:08.306418	0.9100	BLOCK	2026-05-23 00:44:09.443182
3	transaction	arjola	2	85.50	192.168.1.100	Mobile_iOS	2026-05-13 00:44:08.306418	0.1200	ALLOW	2026-05-23 00:44:09.443183
4	transaction	besnik	3	8500.00	89.44.201.77	Mobile_Android	2026-05-21 00:44:08.306418	0.9300	BLOCK	2026-05-23 00:44:09.443183
5	transaction	erjon	5	750.00	185.220.101.5	Mobile_Android	2026-05-15 00:44:08.306418	0.8700	BLOCK	2026-05-23 00:44:09.443184
6	login	erjon	5	\N	185.220.101.5	Unknown_Device	2026-05-14 00:44:08.306418	0.7900	MFA_CHALLENGE	2026-05-23 00:44:09.443185
7	transaction	elona	4	98.40	192.168.1.55	Mobile_iOS	2026-05-09 00:44:08.306418	0.0800	ALLOW	2026-05-23 00:44:09.443186
\.


--
-- TOC entry 4961 (class 0 OID 16636)
-- Dependencies: 226
-- Data for Name: fraud_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fraud_alerts (id, user_id, event_id, alert_type, severity, message, is_read, created_at) FROM stdin;
1	2	\N	suspicious_transfer	high	Transfer i pazakonte prej 1,800 EUR drejt Berlinit u bllokua.	f	2026-05-23 00:44:09.447414
2	2	\N	account_takeover	critical	Tentative hyrjeje nga IP e huaj (89.96.123.45) u zbulua dhe u bllokua.	f	2026-05-23 00:44:09.447417
3	3	\N	suspicious_transfer	critical	Transfer i pazakonte prej 8,500 EUR drejt Athinase u bllokua automatikisht.	f	2026-05-23 00:44:09.447418
4	5	\N	account_takeover	high	Tentative hyrjeje nga pajisje e panjohur u zbulua dhe u bllokua.	f	2026-05-23 00:44:09.447419
5	5	\N	suspicious_transfer	critical	Transfer i dyshimte prej 900 EUR drejt Milanos u bllokua.	f	2026-05-23 00:44:09.44742
\.


--
-- TOC entry 4959 (class 0 OID 16617)
-- Dependencies: 224
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, client_id, user_id, profile_data, last_updated) FROM stdin;
\.


--
-- TOC entry 4963 (class 0 OID 16658)
-- Dependencies: 228
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, event_id, tx_type, recipient, amount, city, device, is_fraud, created_at) FROM stdin;
1	2	\N	Deposit	Paga Mujore	2100.00	Tirane	Desktop Mac	f	2026-05-03 00:44:08.306418
2	2	\N	Payment	OSHEE sh.a.	-125.50	Tirane	Mobile iOS	f	2026-05-08 00:44:08.306418
3	2	\N	Payment	UKT Ujsjelles	-48.20	Tirane	Mobile iOS	f	2026-05-13 00:44:08.306418
4	2	\N	Transfer	Besnik Kola	-350.00	Berat	Desktop Mac	f	2026-05-16 00:44:08.306418
5	2	\N	Transfer	Unknown (Berlin)	-1800.00	Berlin	Mobile Android	t	2026-05-20 00:44:08.306418
6	2	\N	Transfer	Unknown (Rome)	-5000.00	Rome	Desktop Windows	t	2026-05-22 00:44:08.306418
7	3	\N	Deposit	Paga Mujore	3500.00	Tirane	Desktop Mac	f	2026-04-28 00:44:08.306418
8	3	\N	Transfer	Elona Dervishi	-500.00	Tirane	Desktop Mac	f	2026-05-05 00:44:08.306418
9	3	\N	Payment	Vodafone AL	-29.99	Tirane	Mobile iOS	f	2026-05-13 00:44:08.306418
10	3	\N	Transfer	Unknown (Athens)	-8500.00	Athens	Mobile Android	t	2026-05-21 00:44:08.306418
11	4	\N	Deposit	Paga Mujore	2200.00	Tirane	Mobile iOS	f	2026-05-01 00:44:08.306418
12	4	\N	Payment	OSHEE sh.a.	-98.40	Tirane	Mobile iOS	f	2026-05-09 00:44:08.306418
13	4	\N	Payment	ALBtelecom	-19.99	Tirane	Desktop Mac	f	2026-05-17 00:44:08.306418
14	5	\N	Deposit	Paga Mujore	900.00	Tirane	Mobile Android	f	2026-04-23 00:44:08.306418
15	5	\N	Transfer	Unknown (Istanbul)	-750.00	Istanbul	Mobile Android	t	2026-05-15 00:44:08.306418
16	5	\N	Transfer	Unknown (Milan)	-900.00	Milan	Mobile Android	t	2026-05-19 00:44:08.306418
\.


--
-- TOC entry 4955 (class 0 OID 16583)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, full_name, iban, balance, is_active, created_at, pin_hash) FROM stdin;
1	admin	admin@guardianai.al	$2b$12$DY.lOoKFR/I2UwDtD.y9Lut1JKXivPCsITZaumWlTy0vVf1BMOML2	admin	Admin GuardianAI	\N	0.00	t	2026-05-23 00:44:09.439595	$2b$12$Cwr2dlDGEMTcOVzweyvcTuyDq9ZRCGtZpGXkSlEHNnKXFvqFhB3Zm
2	arjola	arjola@fibank.al	$2b$12$k17mUsSjc.OPt/Lu5LYxCOayRpwYfj6t71PgnmnXAOUyf8jg1b.sG	user	Arjola Hoxha	AL47 2121 1009 0000 0002 3569 8741	4287.50	t	2026-05-23 00:44:09.439598	$2b$12$HUqTeiDGkq36hlMFlSvhD.4NBsy50l6aO5uYhwKhWXM2Mb8wbIRty
3	besnik	besnik@fibank.al	$2b$12$1.LbexiYH2gPQ.1YzOJ3w.r.tf/Lpzkxz9W7iOsjDn9brEgQZHCHW	user	Besnik Kola	AL47 2121 1009 0000 0003 1122 3344	12500.00	t	2026-05-23 00:44:09.439599	$2b$12$TrMJN8qSkW8QloiQnjvja.1KAEnGsN/TOM7c16VjdYXjdaIStZmVK
4	elona	elona@fibank.al	$2b$12$HX.9cWe1scM6Euqa2y/IL.zus8bIRxPJupSZPkqKgnjTM159U9Ia6	user	Elona Dervishi	AL47 2121 1009 0000 0004 5566 7788	3200.75	t	2026-05-23 00:44:09.439601	$2b$12$LQRdZlmeGvTzCYi8SvyuC.XFM350lkLWwamM/UBewZyXJ7eHnHLyi
5	erjon	erjon@fibank.al	$2b$12$B1jyQ66f3yKg8aG8IiE33.zYyraJfwInvX/LapXtAEoPK.zZplLG.	user	Erjon Malaj	AL47 2121 1009 0000 0005 9900 1122	890.20	t	2026-05-23 00:44:09.439601	$2b$12$yiuerRCU9v8kEaH8ZBEwJOGy8xspWvOeuMOIzQmcEvDOFbunvsILq
\.


--
-- TOC entry 4974 (class 0 OID 0)
-- Dependencies: 221
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 7, true);


--
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 225
-- Name: fraud_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fraud_alerts_id_seq', 5, true);


--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 223
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profiles_id_seq', 1, false);


--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 227
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 16, true);


--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 4788 (class 2606 OID 16609)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 16645)
-- Name: fraud_alerts fraud_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_alerts
    ADD CONSTRAINT fraud_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 4792 (class 2606 OID 16628)
-- Name: profiles profiles_client_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_client_id_key UNIQUE (client_id);


--
-- TOC entry 4794 (class 2606 OID 16626)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4800 (class 2606 OID 16665)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 16598)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4784 (class 2606 OID 16594)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 16596)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4789 (class 1259 OID 16615)
-- Name: ix_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_events_id ON public.events USING btree (id);


--
-- TOC entry 4797 (class 1259 OID 16656)
-- Name: ix_fraud_alerts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_fraud_alerts_id ON public.fraud_alerts USING btree (id);


--
-- TOC entry 4790 (class 1259 OID 16634)
-- Name: ix_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_profiles_id ON public.profiles USING btree (id);


--
-- TOC entry 4798 (class 1259 OID 16676)
-- Name: ix_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_transactions_id ON public.transactions USING btree (id);


--
-- TOC entry 4780 (class 1259 OID 16599)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 4801 (class 2606 OID 16610)
-- Name: events events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4803 (class 2606 OID 16651)
-- Name: fraud_alerts fraud_alerts_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_alerts
    ADD CONSTRAINT fraud_alerts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 4804 (class 2606 OID 16646)
-- Name: fraud_alerts fraud_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_alerts
    ADD CONSTRAINT fraud_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4802 (class 2606 OID 16629)
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4805 (class 2606 OID 16671)
-- Name: transactions transactions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 4806 (class 2606 OID 16666)
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2026-05-23 03:22:55

--
-- PostgreSQL database dump complete
--

\unrestrict gF8ZJnXhRLcO7HVxGUctqRiknEbtKiAuCjUOI8eEfdmUdb1UtGIbegSkA7p8j5d

