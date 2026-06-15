export type NearbyPerson = {
  id: string;
  name: string;
  profession: string;
  city: string;
  bio: string;
};

export type FeaturedEvent = {
  id: string;
  label: string;
  title: string;
  city: string;
  description: string;
};

export const nearbyPeople: NearbyPerson[] = [
  {
    id: "1",
    name: "Alejandro Ruiz",
    profession: "Marketing & Growth",
    city: "Madrid",
    bio: "Ayudo a startups y negocios locales a crecer mediante estrategias de marketing y adquisición de clientes.",
  },
  {
    id: "2",
    name: "Daniel Torres",
    profession: "Entrenador Personal",
    city: "Madrid",
    bio: "Entrenamiento personalizado, nutrición y mejora del rendimiento físico.",
  },
  {
    id: "3",
    name: "Javier Molina",
    profession: "Full Stack Developer",
    city: "Madrid",
    bio: "Desarrollo aplicaciones web modernas para startups y empresas.",
  },
  {
    id: "4",
    name: "Laura Fernández",
    profession: "Diseñadora UX/UI",
    city: "Madrid",
    bio: "Diseño experiencias digitales centradas en el usuario y conversiones reales.",
  },
];

export const featuredEvents: FeaturedEvent[] = [
  {
    id: "1",
    label: "EVENTOS",
    title: "Primor Las Arenas",
    city: "Las Palmas",
    description:
      "Descuento en perfumes y promoción activa para descubrir nuevas experiencias cerca de ti.",
  },
  {
    id: "2",
    label: "NETWORKING",
    title: "Coffee Meetups",
    city: "Madrid",
    description:
      "Encuentro rápido para conectar con profesionales de marketing, tech y diseño.",
  },
  {
    id: "3",
    label: "PROMO",
    title: "Brunch Productivo",
    city: "Barcelona",
    description:
      "Actividades locales para profesionales que quieren moverse y hacer conexiones útiles.",
  },
];