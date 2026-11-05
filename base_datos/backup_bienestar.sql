--
-- PostgreSQL database dump
--

\restrict XpzvK3oYTkuYIBy7EQMkl914et9itIRcTCEQCdVh7h8OHaFTpMNKDLQegaS8XfG

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: administradores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradores (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    cargo character varying(100)
);


--
-- Name: administradores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.administradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: administradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.administradores_id_seq OWNED BY public.administradores.id;


--
-- Name: citas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citas (
    id integer NOT NULL,
    estudiante_id integer NOT NULL,
    profesional_id integer NOT NULL,
    servicio_id integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    motivo text,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT citas_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'cancelada'::character varying, 'realizada'::character varying])::text[])))
);


--
-- Name: citas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citas_id_seq OWNED BY public.citas.id;


--
-- Name: consultas_ia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultas_ia (
    id integer NOT NULL,
    estudiante_id integer NOT NULL,
    mensaje text NOT NULL,
    respuesta_ia text,
    categoria_detectada character varying(50),
    recomendacion character varying(50),
    fecha timestamp without time zone DEFAULT now()
);


--
-- Name: consultas_ia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consultas_ia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consultas_ia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consultas_ia_id_seq OWNED BY public.consultas_ia.id;


--
-- Name: disponibilidad_profesionales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad_profesionales (
    id integer NOT NULL,
    profesional_id integer NOT NULL,
    dia_semana character varying(15) NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    CONSTRAINT disponibilidad_profesionales_dia_semana_check CHECK (((dia_semana)::text = ANY ((ARRAY['Lunes'::character varying, 'Martes'::character varying, 'Miércoles'::character varying, 'Jueves'::character varying, 'Viernes'::character varying, 'Sábado'::character varying, 'Domingo'::character varying])::text[])))
);


--
-- Name: disponibilidad_profesionales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disponibilidad_profesionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: disponibilidad_profesionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disponibilidad_profesionales_id_seq OWNED BY public.disponibilidad_profesionales.id;


--
-- Name: estados_animo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados_animo (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL,
    emoji character varying(10),
    valor integer NOT NULL,
    CONSTRAINT estados_animo_valor_check CHECK (((valor >= 1) AND (valor <= 5)))
);


--
-- Name: estados_animo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estados_animo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_animo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estados_animo_id_seq OWNED BY public.estados_animo.id;


--
-- Name: estudiantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estudiantes (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    codigo_estudiantil character varying(30) NOT NULL,
    carrera character varying(100),
    facultad character varying(100),
    semestre integer
);


--
-- Name: estudiantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estudiantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estudiantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estudiantes_id_seq OWNED BY public.estudiantes.id;


--
-- Name: factores_bienestar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factores_bienestar (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: factores_bienestar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.factores_bienestar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factores_bienestar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.factores_bienestar_id_seq OWNED BY public.factores_bienestar.id;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    fecha timestamp without time zone DEFAULT now(),
    tipo character varying(30) DEFAULT 'info'::character varying,
    estudiante_id integer
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- Name: profesionales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profesionales (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    servicio_id integer NOT NULL,
    numero_licencia character varying(50),
    especialidad character varying(100)
);


--
-- Name: profesionales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profesionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profesionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profesionales_id_seq OWNED BY public.profesionales.id;


--
-- Name: registro_factores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_factores (
    registro_id integer NOT NULL,
    factor_id integer NOT NULL
);


--
-- Name: registros_bienestar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_bienestar (
    id integer NOT NULL,
    estudiante_id integer NOT NULL,
    estado_animo_id integer NOT NULL,
    nivel_estres integer,
    comentario text,
    fecha_registro timestamp without time zone DEFAULT now(),
    CONSTRAINT registros_bienestar_nivel_estres_check CHECK (((nivel_estres >= 1) AND (nivel_estres <= 5)))
);


--
-- Name: registros_bienestar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registros_bienestar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registros_bienestar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registros_bienestar_id_seq OWNED BY public.registros_bienestar.id;


--
-- Name: servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


--
-- Name: servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_id_seq OWNED BY public.servicios.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    tipo_usuario character varying(20) NOT NULL,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT now(),
    reset_token character varying(255),
    reset_token_expira timestamp without time zone,
    reset_intentos integer DEFAULT 0,
    telefono character varying(20),
    CONSTRAINT usuarios_tipo_usuario_check CHECK (((tipo_usuario)::text = ANY ((ARRAY['estudiante'::character varying, 'profesional'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: administradores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores ALTER COLUMN id SET DEFAULT nextval('public.administradores_id_seq'::regclass);


--
-- Name: citas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas ALTER COLUMN id SET DEFAULT nextval('public.citas_id_seq'::regclass);


--
-- Name: consultas_ia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas_ia ALTER COLUMN id SET DEFAULT nextval('public.consultas_ia_id_seq'::regclass);


--
-- Name: disponibilidad_profesionales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_profesionales ALTER COLUMN id SET DEFAULT nextval('public.disponibilidad_profesionales_id_seq'::regclass);


--
-- Name: estados_animo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_animo ALTER COLUMN id SET DEFAULT nextval('public.estados_animo_id_seq'::regclass);


--
-- Name: estudiantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiantes ALTER COLUMN id SET DEFAULT nextval('public.estudiantes_id_seq'::regclass);


--
-- Name: factores_bienestar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factores_bienestar ALTER COLUMN id SET DEFAULT nextval('public.factores_bienestar_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- Name: profesionales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales ALTER COLUMN id SET DEFAULT nextval('public.profesionales_id_seq'::regclass);


--
-- Name: registros_bienestar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_bienestar ALTER COLUMN id SET DEFAULT nextval('public.registros_bienestar_id_seq'::regclass);


--
-- Name: servicios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id SET DEFAULT nextval('public.servicios_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: administradores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.administradores (id, usuario_id, cargo) FROM stdin;
1	5	Coordinador de Bienestar
\.


--
-- Data for Name: citas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citas (id, estudiante_id, profesional_id, servicio_id, fecha, hora, estado, motivo, creado_en) FROM stdin;
1	4	1	1	2026-12-09	11:00:00	cancelada	dfsdsfs	2026-10-01 17:06:14.34397
2	4	1	1	2026-10-22	11:00:00	confirmada	fghgfhgfbfg	2026-10-01 18:21:35.20867
3	4	1	1	2026-10-15	16:00:00	confirmada	\N	2026-10-01 18:30:16.284092
6	4	1	1	2026-10-26	09:00:00	cancelada	me quiero morir	2026-10-15 22:06:58.922713
5	4	1	1	2026-10-28	09:00:00	cancelada	reggerger	2026-10-17 21:44:17.512157
4	4	1	1	2026-10-29	14:00:00	cancelada	mal de la mente	2026-10-17 21:38:33.394237
7	5	1	1	2026-10-30	11:00:00	realizada	fgfhgf	2026-10-15 22:15:13.451845
8	9	1	1	2026-11-24	10:00:00	pendiente	me siento mal	2026-11-04 19:33:44.592549
\.


--
-- Data for Name: consultas_ia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consultas_ia (id, estudiante_id, mensaje, respuesta_ia, categoria_detectada, recomendacion, fecha) FROM stdin;
1	4	Me siento estresado/a por los exámenes	Te entiendo, Yhoryi, la temporada de exámenes puede sentirse bastante abrumadora y es totalmente normal que te sientas así. A veces ayuda hacer una pausa breve de cinco minutos y organizar el estudio enfocándote en una sola cosa a la vez. ¿Qué examen o materia es la que más te tiene pensando ahora?	estres_academico	autocuidado	2026-10-07 22:13:01.666968
2	4	mal por los calculos	Cálculo suele ser una materia bastante exigente y es totalmente comprensible que te sientas así, Yhoryi. Cuando el tema se siente muy pesado, ayuda mucho dividir los ejercicios en pasos pequeños y hacer pausas cortas para despejar la mente. ¿Qué es lo que más complicado se te está haciendo en este momento?	estres_academico	autocuidado	2026-10-07 22:23:05.766553
3	4	ya no quiero seguir viviendo	Yhoryi, lamento mucho que te sientas con tanto dolor en este momento, pero por favor no olvides que no estás solo y que tu vida es muy valiosa. Te pido que hables con alguien de confianza ahora mismo y te comuniques gratis a la Línea 106 (apoyo en salud mental) o al 123 si estás en peligro inmediato. Por favor, considera también pedir una cita hoy mismo en el módulo de Bienestar para que podamos acompañarte y apoyarte.	riesgo	agendar_cita	2026-10-07 22:39:24.101414
4	4	me voy a morir ya no aguanto mas	Yhoryi, por favor no te rindas, tu vida es sumamente valiosa y no tienes que pasar por este dolor a solas. Te pido que te comuniques inmediatamente a la Línea 106 o al 123 si estás en peligro, y que busques a una persona de confianza en este momento. Por favor, agenda una cita en el módulo de Bienestar para que podamos darte el apoyo profesional que necesitas.	riesgo	agendar_cita	2026-10-07 22:41:54.290607
5	4	ya no voy hacer eso, creo que voy a estudiar	Me alegra mucho leer eso, Yhoryi, y me alivia saber que quieres retomar tus estudios con más tranquilidad. Sin embargo, como hace un momento te sentías tan abrumado, recuerda que es muy importante cuidar de ti y no cargar con todo esto solo; por eso, te invito a agendar una cita en Bienestar para que te apoyemos. ¿Te gustaría intentar estudiar hoy solo un ratito y haciendo pausas suaves?	riesgo	agendar_cita	2026-10-07 22:42:18.869571
6	4	si, me puedes explicar calculo ?	Me encantaría poder ayudarte directamente con los temas de cálculo, Yhoryi, pero mi labor aquí es acompañarte en cómo te sientes con todo esto. Sé que quieres avanzar, pero recuerda ir con calma después del momento tan difícil que pasaste hace un rato. ¿Cómo te sientes en este momento para empezar a estudiar?	estres_academico	agendar_cita	2026-10-07 22:43:10.496273
7	4	mal me da pereza estudiar	Es completamente normal que sientas pereza y falta de energía, Yhoryi, sobre todo después del día tan estresante que has tenido. Tu mente y tu cuerpo necesitan un descanso real antes de exigirse más. ¿Qué te parece si por hoy descansas y dejas el estudio para mañana con la mente más despejada?	estres_academico	agendar_cita	2026-10-07 22:43:34.164014
8	4	nada no puedo para maañana tengo el parcial, yo creo que ya lo perdi	Entiendo la angustia de sentir que el tiempo se agota y que ya no hay nada que hacer, Yhoryi. Pero recuerda que una nota no define tu valor y tu tranquilidad siempre va primero. Intenta revisar solo un concepto clave sin presionarte por el resto, ¿te parecería bien intentar eso por unos minutos?	riesgo	agendar_cita	2026-10-07 22:44:18.11066
9	4	hola	¡Hola, Yhoryi! Qué gusto saludarte de nuevo. ¿Cómo te has sentido en el día de hoy?	otro	ninguna	2026-10-13 21:35:31.048448
10	4	me he vuelto a sentir mal	Lamento mucho que te estés sintiendo mal de nuevo, Yhoryi. Es completamente válido que haya días en los que el malestar vuelva, y no tienes que atravesarlo en soledad. ¿Quieres contarme qué ha estado pasando o qué pensamientos te tienen así?	tristeza	agendar_cita	2026-10-13 21:35:53.328339
11	4	si los parciales me tienen loco son muchas cosas	Es muy comprensible que te sientas abrumado, Yhoryi; la época de parciales acumula muchísima presión y a veces parece imposible abarcarlo todo. Validar que estás saturado es el primer paso para no exigirte de más. ¿Qué tal si elegimos solo una pequeña tarea para empezar y dejamos el resto a un lado por un rato?	estres_academico	autocuidado	2026-10-13 21:36:23.75117
12	4	son muchas cosas no se como hacerlas	Es muy normal sentirse bloqueado cuando todo se junta, Yhoryi, pero no tienes que resolver la carrera entera hoy. Intenta anotar en un papel tres cosas pendientes y enfócate solo en la más pequeña o urgente, olvidándote de las demás por un momento. Si sientes que este estrés es constante y te desborda, recuerda que puedes agendar una cita en el módulo de Citas con el equipo de Bienestar. ¿Te animas a escribir esa lista corta?	estres_academico	agendar_cita	2026-10-13 21:37:00.805113
13	4	no la verdad ya noquiero hacer nada mas quiero como quitarme la vida no se	Yhoryi, me preocupa mucho lo que me cuentas y quiero que sepas que tu vida es muy valiosa y no tienes que pasar por este dolor solo. Por favor, habla en este momento con alguien de confianza o comunícate de inmediato a la Línea 106 (gratuita, 24 horas) o al 123 si te sientes en peligro. También te pido que agendes una cita desde el módulo de Citas en Bienestar para que un profesional te acompañe. ¿Hay alguna persona cercana a ti a la que le puedas avisar cómo te sientes en este instante?	riesgo	agendar_cita	2026-10-13 21:55:34.149954
14	4	hola	¡Hola, Yhoryi! Me alegra volver a saber de ti. Sigo aquí para acompañarte y me preocupa cómo te estabas sintiendo hace un momento. ¿Cómo te encuentras en este instante?	riesgo	agendar_cita	2026-10-17 21:41:41.737984
15	4	mal los parciales me tiene mal	Entiendo, Yhoryi. Es muy agotador sentir que la carga de los parciales te supera y te hace sentir así de mal. Por favor, no intentes llevar todo este peso a solas; recuerda agendar una cita en nuestro módulo de Bienestar para que podamos apoyarte profesionalmente y hablar con más calma.	riesgo	agendar_cita	2026-10-17 21:42:12.129614
16	4	ya no estiy preocupado y me siento mejor	Me alegra mucho leer que te sientes más tranquilo y un poco mejor, Yhoryi. De todos modos, recuerda ir paso a paso y darte pausas mientras avanzas. ¿Qué te ayudó a sentirte un poco más aliviado?	estres_academico	autocuidado	2026-10-17 21:42:44.779816
17	4	me quiero matar este estudio me tiene aburrido	Yhoryi, me preocupa profundamente que te sientas así de abrumado y frustrado, y no quiero que atravieses esto solo. Tu vida y tu bienestar son lo más importante, mucho más que cualquier examen o estudio. Por favor, habla ahora mismo con una persona de confianza y llama de inmediato a la Línea 106 (gratuita, las 24 horas) o al 123 si sientes que estás en peligro. También te pido que agendes una cita desde nuestro módulo de Citas para que el equipo de Bienestar te acompañe hoy mismo. ¿Podrías llamar a alguien cercano para que esté a tu lado en este momento?	riesgo	agendar_cita	2026-10-17 21:43:20.745316
18	4	me voy a matar	Yhoryi, por favor no lo hagas, tu vida es muy valiosa y hay personas que quieren ayudarte a superar este momento. No estás solo en esto. Llama de inmediato al 123 o a la Línea 106 (disponible las 24 horas, gratuita) para que te brinden apoyo urgente, y busca a alguien de confianza que esté cerca de ti ahora mismo. Por favor, permítenos acompañarte agendando una cita urgente con el equipo de Bienestar.	riesgo	agendar_cita	2026-10-15 22:06:12.359728
19	4	hola	Hola Yhoryi, me alegra que hayas vuelto a escribir. Como mencionaste cosas muy difíciles hace un momento, necesito preguntarte: ¿estás en un lugar seguro ahora y con alguien que te acompañe?	riesgo	agendar_cita	2026-10-29 21:54:36.147368
20	4	si ya estoy mejor	Me da mucho alivio saber que te sientes mejor y que estás a salvo, Yhoryi. De todas formas, los parciales pueden volver a generar mucha presión, así que te sugiero agendar una cita en el módulo de Citas para que recibas el apoyo que mereces. ¿Qué te gustaría hacer hoy para descansar un poco la mente?	estres_academico	agendar_cita	2026-10-29 21:54:59.065114
21	4	hola	Hola Yhoryi, me alegra leerte. Sigo estando aquí para acompañarte. ¿Cómo te has sentido en estas últimas horas?	estres_academico	ninguna	2026-11-04 19:10:16.999506
22	4	mal	Siento mucho que te sigas sintiendo así de mal, Yhoryi. Por favor, no olvides que no tienes que pasar por este sufrimiento a solas y que tu vida es lo más importante. Te animo a que agendes una cita ahora mismo con el equipo de Bienestar y que busques a alguien de confianza o te comuniques a la Línea 106. ¿Hay alguna persona cercana con la que puedas estar en este momento?	riesgo	agendar_cita	2026-11-04 19:10:44.737947
\.


--
-- Data for Name: disponibilidad_profesionales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.disponibilidad_profesionales (id, profesional_id, dia_semana, hora_inicio, hora_fin) FROM stdin;
1	1	Lunes	08:00:00	12:00:00
2	1	Martes	08:00:00	12:00:00
3	1	Miércoles	08:00:00	12:00:00
4	1	Jueves	08:00:00	12:00:00
5	1	Viernes	08:00:00	12:00:00
6	1	Lunes	14:00:00	17:00:00
7	1	Martes	14:00:00	17:00:00
8	1	Miércoles	14:00:00	17:00:00
9	1	Jueves	14:00:00	17:00:00
10	1	Viernes	14:00:00	17:00:00
11	2	Lunes	08:00:00	12:00:00
12	2	Lunes	14:00:00	17:00:00
13	2	Jueves	08:00:00	17:00:00
14	2	Miércoles	08:00:00	17:00:00
15	2	Martes	08:00:00	17:00:00
16	2	Viernes	08:00:00	17:00:00
\.


--
-- Data for Name: estados_animo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estados_animo (id, nombre, emoji, valor) FROM stdin;
1	Muy bien	😊	5
2	Bien	🙂	4
3	Regular	😐	3
4	Mal	😟	2
5	Muy mal	😞	1
\.


--
-- Data for Name: estudiantes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estudiantes (id, usuario_id, codigo_estudiantil, carrera, facultad, semestre) FROM stdin;
1	1	2024001	Ingeniería de Sistemas	Ingeniería	5
2	2	9999	\N	\N	\N
4	4	0192406	\N	\N	\N
5	5	00001	\N	\N	\N
7	7	00002	\N	\N	\N
8	8	0192991	ingenieria sistemas	ingenierias	9
9	10	0193433	\N	\N	\N
\.


--
-- Data for Name: factores_bienestar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factores_bienestar (id, nombre) FROM stdin;
1	Carga académica
2	Problemas personales
3	Falta de sueño
4	Problemas familiares
5	Situación económica
6	Trabajo
7	Exámenes
8	Otro
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificaciones (id, usuario_id, mensaje, leida, fecha, tipo, estudiante_id) FROM stdin;
4	4	Tu cita del 2026-10-22 a las 11:00 fue confirmada.	f	2026-10-01 18:28:31.845984	info	\N
6	4	Tu cita del 2026-10-15 a las 16:00 fue confirmada.	f	2026-10-01 18:33:43.282627	info	\N
7	7	ALERTA: yhoryi carrascal podría estar en una situación de riesgo según su conversación en la plataforma. Requiere atención prioritaria.	t	2026-10-13 21:55:34.174519	alerta_riesgo	4
5	7	Nueva solicitud de cita para el 2026-10-15 a las 16:00.	t	2026-10-01 18:30:16.288784	info	\N
9	4	Tu cita del 2026-10-29 a las 14:00 fue confirmada.	f	2026-10-17 21:39:03.048667	info	\N
10	7	ALERTA: yhoryi carrascal podría estar en una situación de riesgo según su conversación en la plataforma. Requiere atención prioritaria.	t	2026-10-17 21:41:41.759772	alerta_riesgo	4
1	7	Nueva solicitud de cita para el 2026-12-09 a las 11:00.	t	2026-10-01 17:06:14.352803	info	\N
2	7	Un estudiante canceló la cita del 2026-12-09 a las 11:00.	t	2026-10-01 17:06:21.238483	info	\N
3	7	Nueva solicitud de cita para el 2026-10-22 a las 11:00.	t	2026-10-01 18:21:35.214652	info	\N
8	7	Nueva solicitud de cita para el 2026-10-29 a las 14:00.	t	2026-10-17 21:38:33.400364	info	\N
11	7	Nueva solicitud de cita para el 2026-10-28 a las 09:00.	t	2026-10-17 21:44:17.524139	info	\N
12	7	Nueva solicitud de cita para el 2026-10-26 a las 09:00.	f	2026-10-15 22:06:58.92919	info	\N
13	5	Se programó una cita para ti el 2026-10-30 a las 11:00.	f	2026-10-15 22:15:13.457382	info	\N
14	7	Se programó una cita con un estudiante el 2026-10-30 a las 11:00.	f	2026-10-15 22:15:13.460143	info	\N
15	7	Un estudiante canceló la cita del 2026-10-26 a las 09:00.	f	2026-10-23 13:56:56.191263	info	\N
16	7	Un estudiante canceló la cita del 2026-10-28 a las 09:00.	f	2026-10-23 13:57:02.049693	info	\N
17	7	Un estudiante canceló la cita del 2026-10-29 a las 14:00.	f	2026-10-23 13:57:04.505744	info	\N
19	5	Tu cita del 2026-10-30 fue marcada como realizada.	f	2026-11-04 07:25:43.219561	info	\N
18	7	ALERTA: yhoryi carrascal podría estar en una situación de riesgo según su conversación en la plataforma. Requiere atención prioritaria.	t	2026-10-29 21:54:36.191127	alerta_riesgo	4
20	7	ALERTA: yhoryi carrascal podría estar en una situación de riesgo según su conversación en la plataforma. Requiere atención prioritaria.	f	2026-11-04 19:10:44.771019	alerta_riesgo	4
21	9	ALERTA: yhoryi carrascal podría estar en una situación de riesgo según su conversación en la plataforma. Requiere atención prioritaria.	f	2026-11-04 19:10:44.772541	alerta_riesgo	4
22	7	Nueva solicitud de cita para el 2026-11-24 a las 10:00.	f	2026-11-04 19:33:44.597308	info	\N
\.


--
-- Data for Name: profesionales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profesionales (id, usuario_id, servicio_id, numero_licencia, especialidad) FROM stdin;
1	7	1	LIC-0001	Psicología clínica
2	9	1	022222	psicologo
\.


--
-- Data for Name: registro_factores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registro_factores (registro_id, factor_id) FROM stdin;
1	1
2	6
3	6
4	4
5	2
6	4
\.


--
-- Data for Name: registros_bienestar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_bienestar (id, estudiante_id, estado_animo_id, nivel_estres, comentario, fecha_registro) FROM stdin;
1	4	3	3	si estoy mal por los parciales y en la casa	2026-10-07 21:59:08.032384
2	4	5	2	\N	2026-10-17 21:37:45.933004
3	4	2	3	jmmmjm	2026-10-17 21:41:30.77278
4	4	5	3	tengo muchos sentimientos encontrados y no son nada buenos	2026-10-23 13:56:28.567072
5	4	3	3	sfsfds	2026-10-29 21:55:18.904379
6	9	3	2	me siento bastante mal	2026-11-04 19:33:02.692231
\.


--
-- Data for Name: servicios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicios (id, nombre, descripcion) FROM stdin;
1	Psicología	Atención y acompañamiento psicológico para estudiantes
2	Médico	Atención médica general para estudiantes
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, apellido, email, password, tipo_usuario, activo, creado_en, reset_token, reset_token_expira, reset_intentos, telefono) FROM stdin;
4	yhoryi	carrascal	yhoryicarrascal@gmail.com	$2b$10$X.oCwpT.4tqGRnFdho444.vq/UXNg.SZ3rAyhThH2t1atAuGI4UXm	estudiante	t	2026-09-28 22:11:53.292681	\N	\N	0	\N
1	Juan	Pérez	juan@universidad.edu	$2b$10$vHMenuuR..nbXN5k/ruuO.bi.bmqggpw6KnOMENn0XQptGDAHsrTm	estudiante	t	2026-09-02 22:20:19.017494	\N	\N	0	\N
2	Test	Curl	testcurl@universidad.edu	$2b$10$z7zpVRiOeqwtF//nmoI2M.Fop87wfSyMk3aL1YhT5hwFMEvt7rdIq	estudiante	t	2026-09-28 21:40:58.797713	\N	\N	0	\N
9	profesional	2	profesional2@gmail.com	$2b$10$h.dqvXfDRB1f.ixa3aPX4ua8fAwct9AVanDKDve.ZcpDy7gL8Z88G	profesional	t	2026-11-04 09:50:56.683215	\N	\N	0	\N
8	estudinte	1	estudiante1@gmail.com	$2b$10$ysXRvqiWqTU/EZtsOVXGXudFD5wSqCuUkBvZ841uGC46DSbEihPZW	estudiante	t	2026-10-29 22:04:01.109947	\N	\N	0	\N
10	estudiante	3	estudiante2@gmail.com	$2b$10$jFy53bI0UJbhuEbK358JO.LwlsdrWiNNyiZn3AKiT2.nNvM4Zkq8i	estudiante	t	2026-11-04 19:18:20.373811	\N	\N	0	\N
5	admin	1	admin@gmail.com	$2b$10$kYk2DwEHaVXMI27jX7A9FODiUnmDuDkgC32TXbMsg7xW3d9oKSn.u	admin	t	2026-10-01 15:15:54.229622	\N	\N	0	\N
7	profesional	1	profesional@gmail.com	$2b$10$hxl8HXiRjBzUy/jeA3Z2x.FvsnmjiJa61DMSeXfT0V49LefBZX/R2	profesional	t	2026-10-01 15:17:03.326548	\N	\N	0	\N
\.


--
-- Name: administradores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.administradores_id_seq', 1, true);


--
-- Name: citas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citas_id_seq', 8, true);


--
-- Name: consultas_ia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.consultas_ia_id_seq', 22, true);


--
-- Name: disponibilidad_profesionales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.disponibilidad_profesionales_id_seq', 16, true);


--
-- Name: estados_animo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.estados_animo_id_seq', 5, true);


--
-- Name: estudiantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.estudiantes_id_seq', 9, true);


--
-- Name: factores_bienestar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.factores_bienestar_id_seq', 8, true);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificaciones_id_seq', 22, true);


--
-- Name: profesionales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profesionales_id_seq', 2, true);


--
-- Name: registros_bienestar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registros_bienestar_id_seq', 6, true);


--
-- Name: servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.servicios_id_seq', 2, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 10, true);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: administradores administradores_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_usuario_id_key UNIQUE (usuario_id);


--
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- Name: consultas_ia consultas_ia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas_ia
    ADD CONSTRAINT consultas_ia_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad_profesionales disponibilidad_profesionales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_profesionales
    ADD CONSTRAINT disponibilidad_profesionales_pkey PRIMARY KEY (id);


--
-- Name: estados_animo estados_animo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_animo
    ADD CONSTRAINT estados_animo_pkey PRIMARY KEY (id);


--
-- Name: estudiantes estudiantes_codigo_estudiantil_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_codigo_estudiantil_key UNIQUE (codigo_estudiantil);


--
-- Name: estudiantes estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_pkey PRIMARY KEY (id);


--
-- Name: estudiantes estudiantes_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_usuario_id_key UNIQUE (usuario_id);


--
-- Name: factores_bienestar factores_bienestar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factores_bienestar
    ADD CONSTRAINT factores_bienestar_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: profesionales profesionales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_pkey PRIMARY KEY (id);


--
-- Name: profesionales profesionales_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_usuario_id_key UNIQUE (usuario_id);


--
-- Name: registro_factores registro_factores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_factores
    ADD CONSTRAINT registro_factores_pkey PRIMARY KEY (registro_id, factor_id);


--
-- Name: registros_bienestar registros_bienestar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_bienestar
    ADD CONSTRAINT registros_bienestar_pkey PRIMARY KEY (id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: citas_horario_unico; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX citas_horario_unico ON public.citas USING btree (profesional_id, fecha, hora) WHERE ((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying])::text[]));


--
-- Name: administradores administradores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: citas citas_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


--
-- Name: citas citas_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id);


--
-- Name: citas citas_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: consultas_ia consultas_ia_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas_ia
    ADD CONSTRAINT consultas_ia_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


--
-- Name: disponibilidad_profesionales disponibilidad_profesionales_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_profesionales
    ADD CONSTRAINT disponibilidad_profesionales_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id) ON DELETE CASCADE;


--
-- Name: estudiantes estudiantes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: notificaciones notificaciones_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: profesionales profesionales_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: profesionales profesionales_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: registro_factores registro_factores_factor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_factores
    ADD CONSTRAINT registro_factores_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES public.factores_bienestar(id) ON DELETE CASCADE;


--
-- Name: registro_factores registro_factores_registro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_factores
    ADD CONSTRAINT registro_factores_registro_id_fkey FOREIGN KEY (registro_id) REFERENCES public.registros_bienestar(id) ON DELETE CASCADE;


--
-- Name: registros_bienestar registros_bienestar_estado_animo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_bienestar
    ADD CONSTRAINT registros_bienestar_estado_animo_id_fkey FOREIGN KEY (estado_animo_id) REFERENCES public.estados_animo(id);


--
-- Name: registros_bienestar registros_bienestar_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_bienestar
    ADD CONSTRAINT registros_bienestar_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XpzvK3oYTkuYIBy7EQMkl914et9itIRcTCEQCdVh7h8OHaFTpMNKDLQegaS8XfG

