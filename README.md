# immutable-record-updater

## Introduction

"immutable-record-updater" is the library, which helps you update record without breaking changes.

## Installation

```
npm i --save-dev @mm1995tk/immutable-record-updater
```

## Usage

suppose you define a type "Person".

```ts
type Person = {
  name: string;
  from: {
    name: string;
    category: string;
    famous: {
      people: string[];
      place: {
        park: string[];
      };
    };
  };
  living: {
    name: string;
    category: string;
    famous: {
      people: string[];
      place: {
        park: string[];
      };
    };
  };
};

const person: Person = {
  name: 'John Smith',
  from: {
    name: 'New York',
    category: 'City',
    famous: {
      people: ['Jay-Z', 'Lady Gaga'],
      place: {
        park: ['Central Park', 'Battery Park'],
      },
    },
  },
  living: {
    name: 'Los Angeles',
    category: 'City',
    famous: {
      people: ['Kobe Bryant', 'LeBron James'],
      place: {
        park: ['Griffith Park'],
      },
    },
  },
};
```

if you update person.from.famous.people and person.living.famous.place.park without breaking changes by scratch, it will be...

```ts
const person2: Person = {
  ...person,
  from: {
    ...person.from,
    famous: {
      ...person.from.famous,
      people: [...person.from.famous.people, 'Beyoncé'],
    },
  },
  living: {
    ...person.living,
    famous: {
      ...person.living.famous,
      place: {
        ...person.living.famous.place,
        park: [...person.living.famous.place.park, 'Echo Park'],
      },
    },
  },
};
```

but you can do same thing more simply by using this library.

```ts
import imRecUp from '@mm1995tk/immutable-record-updater';

const composerOfProgram = imRecUp.generateComposerOfUpdater<Person>();

const program = composerOfProgram(updater => {
  const updateFromFamousPeople = updater('from.famous.people', item => [...item, 'Beyoncé']);

  const updateLivingFamousPlacePark = updater('living.famous.place.park', item => [...item, 'Echo Park']);

  return [updateFromFamousPeople, updateLivingFamousPlacePark];
});

const person2: Person = program.run(person);
```

if you update only one prop,

```ts
import imRecUp from '@mm1995tk/immutable-record-updater';

const updater = imRecUp.generateRecordUpdater<Person>();
const program = updater('age', 20); // or updater('age', age => { .. })

const person2: Person = program.run(person);
```
