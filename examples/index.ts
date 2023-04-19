import imRecUp from '../src';

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

// personに破壊的変更を加えず、person.from.famous.people と person.living.famous.place.parkにそれぞれ要素を一つ追加してくだい。

// 愚直にやると
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

// 本ライブラリを利用すると

const composerOfProgram = imRecUp.generateComposerOfUpdater<Person>();

const program = composerOfProgram(up => {
  const updateFromFamousPeople = up('from.famous.people', item => [...item, 'Beyoncé']);
  const updateLivingFamousPlacePark = up('living.famous.place.park', item => [...item, 'Echo Park']);

  return [updateFromFamousPeople, updateLivingFamousPlacePark];
});

console.dir({ person, person2, person3: program.run(person) }, { depth: 10 });
