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
  age: number;
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
  age: 28,
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

const updater = imRecUp.generateRecordUpdater<Person>();

const program = updater
  .set('from.famous.people', item => [...item, 'Beyoncé'])
  .set('living.famous.place.park', item => [...item, 'Echo Park']);

const person2 = program.run(person); // { success: true, data: {..}}
```

If you wish to add restrictions (e.g., age must not be less than 30),　 you can do it like this.

```ts
import imRecUp from '@mm1995tk/immutable-record-updater';

type ErrKind = 'AgeIsLessThanTen';

const updater = imRecUp.generateRecordUpdater<Person, ErrKind>(person => person.age >= 30 || 'AgeIsLessThanTen');

const program = updater
  .set('from.famous.people', item => [...item, 'Beyoncé'])
  .set('living.famous.place.park', item => [...item, 'Echo Park']);

const person2 = program.run(person); // { success: false, error: ['AgeIsLessThanTen'] data: {..}}
```

Also, if you want to decide how to update from the current state, do it like this.

```ts
import imRecUp from '@mm1995tk/immutable-record-updater';

type ErrKind = 'AgeIsLessThanTen';

const updater = imRecUp.generateRecordUpdater<Person, ErrKind>(person => person.age >= 30 || 'AgeIsLessThanTen');

const program = updater
  .set('age', (item, getPreState) => {
    const preState = getPreState();
    // checking if data satisfy constraints
    if (preState.success) {
      return item;
    }
    return item + 5;
  })
  .set('from.famous.people', item => [...item, 'Beyoncé'])
  .set('living.famous.place.park', item => [...item, 'Echo Park']);

const person2 = program.run(person); // { success: true, data: {..}}
```
