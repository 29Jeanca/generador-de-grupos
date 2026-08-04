import { generateGroupsByCount } from "./grouping.js";

export const DESAMPARADOS_STUDENTS = [
  "Aaron Caleb Rivera Pérez",
  "Aiden Montero Pérez",
  "Alex Anderson Aguilar Lopez",
  "Alex Fabian Cubero Duarte",
  "Ana Maria Ocampo Esquivel",
  "Angel Daniela Salazar Tremiño",
  "Bianca Robles Hurtado",
  "Bryan Andrew Gomez Jiménez",
  "Daniel Isaías Ramírez Manzanares",
  "Daniel Josué Ortega Rodriguez",
  "Ernesto Libby Lugo",
  "Geiner Eduardo Mora Espinoza",
  "Hellen Fabiola Quesada Rojas",
  "Heylin Daniela Moya Cervantes (KRISHNA NAHIEL MOYA)",
  "Isaac Andres Cascante Linares",
  "Jeffrey Samuel Ellis Morales",
  "Johandy balitan Chacón",
  "Kendall Goevanni Hernández Bermúdez",
  "Luis Alberto Mendez Pozo",
  "María Fernanda González Rivera",
  "Moisés Urbina Gaitán",
  "Raymond Salguero Castillo",
  "Sebastian Geovanni Flores Miranda",
  "Sebastian Moises Vallecillo Moya",
  "Tifanny lorette Bejarano Mora",
  "Ulysses Quiros Valverde",
  "Víctor Manuel González Trejos",
];

export const PUNTARENAS_STUDENTS = [
  "Alanie Marisa Castillo Ruiz",
  "Andrés Pérez Leiva",
  "Bernny Dumani Vásquez",
  "Erian Badilla Fallas",
  "Kendall Mauricio Salazar Vargas",
  "Oscar Yabeth Guido Rosales",
  "Rossman Doan Rivera Cano",
  "Wayner Villalobos Arauz",
  "Yubran Osmar López Martínez",
  "Jared Osari Prendas Ramírez",
  "Arly Cruz Moscoso",
  "Kevin Ortiz Bolaños",
  "Pablo Steve Bejarano Gomez",
  "Eduardo Josue Zamora Valverde",
  "Josue Alberto Cruz Alemán",
  "Hanxel Badilla Zuñiga",
  "Eiker Manuel Abarca Murillo",
  "Patrick Jeremy Oviedo Rojas",
];

export function makeDefaultCourse(id, label, students) {
  return {
    id,
    label,
    students,
    sizeMode: "count",
    numGroups: 4,
    groupSize: 2,
    mode: "ordenado",
    groups: generateGroupsByCount(students, 4, "ordenado"),
    constraints: [],
  };
}

export function defaultCourses() {
  return [
    makeDefaultCourse("desamparados", "Desamparados", DESAMPARADOS_STUDENTS),
    makeDefaultCourse("puntarenas", "Puntarenas", PUNTARENAS_STUDENTS),
  ];
}
