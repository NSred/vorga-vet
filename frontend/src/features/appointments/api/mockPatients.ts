import type { Species } from '@/shared/domain/species'

export interface MockPatient {
  id: string
  cardNumber: string
  name: string
  species: Species
  breed: string
  allergies: string
  ownerName: string
  phone?: string
}

export const mockPatients: MockPatient[] = [
  {
    id: 'p1',
    cardNumber: '02646',
    name: 'Keti',
    species: 'cat',
    breed: 'Chartreux',
    allergies: 'none',
    ownerName: 'Stupar Dragan',
    phone: '064/3340181',
  },
  {
    id: 'p2',
    cardNumber: '04323',
    name: 'Lio',
    species: 'dog',
    breed: 'Bichon Frise',
    allergies: 'pollen',
    ownerName: 'Stupar Gordana',
    phone: '063/1805969',
  },
  {
    id: 'p3',
    cardNumber: '01804',
    name: 'Bela',
    species: 'dog',
    breed: 'American Staffordshire Terrier',
    allergies: 'food',
    ownerName: 'Subić Vladimir',
    phone: '060/7301103',
  },
  {
    id: 'p4',
    cardNumber: '00498',
    name: 'Mita',
    species: 'dog',
    breed: 'Pug',
    allergies: 'fleas_ticks',
    ownerName: 'Subić i Snežana',
    phone: '021/553494',
  },
  {
    id: 'p5',
    cardNumber: '03311',
    name: 'Rex',
    species: 'dog',
    breed: 'German Shepherd',
    allergies: 'none',
    ownerName: 'Jovanović Petar',
    phone: '065/2210044',
  },
  {
    id: 'p6',
    cardNumber: '02219',
    name: 'Luna',
    species: 'cat',
    breed: 'Domestic Shorthair',
    allergies: 'medication',
    ownerName: 'Petrović Ana',
    phone: '062/8890021',
  },
  {
    id: 'p7',
    cardNumber: '01122',
    name: 'Coco',
    species: 'bird',
    breed: 'Parrot',
    allergies: 'other',
    ownerName: 'Nikolić Milan',
    phone: '064/1123344',
  },
  {
    id: 'p8',
    cardNumber: '00877',
    name: 'Maza',
    species: 'dog',
    breed: 'Dachshund',
    allergies: 'none',
    ownerName: 'Ilić Snežana',
    phone: '061/7765432',
  },
]
