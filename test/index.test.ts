import { generateRecordUpdater } from '../src';

const throwErrorIfAgeIsLessThanTen = (person: Person): Person => {
  if (person.age < 10) {
    throw new Error('must be age >= 10');
  }
  return person;
};

describe('test of generateRecordUpdater', () => {
  const updater = generateRecordUpdater<Person>(throwErrorIfAgeIsLessThanTen);

  test('if age < 10 then throw error', () => {
    expect(() => {
      updater.set('age', 8).run(person);
    }).toThrowError('must be age >= 10');
  });

  test('if age is even then age+=1 else age+=2', () => {
    const program = updater.set('age', age => {
      if (age % 2) {
        return age + 2;
      }
      return age + 1;
    });
    expect(program.run(person).age).toBe(31);
  });

  test('add person to from.famous.people', () => {
    const program = updater.set('from.famous.people', (people, me) => {
      return [...people, me.name];
    });
    expect(program.run(person).from.famous.people).toEqual(['Jay-Z', 'Lady Gaga', 'John Smith']);
  });

  test('if age < 10 then throw error', () => {
    expect(() => {
      const program = updater.set('age', 8).set('from.famous.people', (people, me) => {
        return [...people, me.name];
      });
      program.run(person);
    }).toThrowError('must be age >= 10');
  });

  test('if age is even then age+=1 else age+=2, and then add person to from.famous.people', () => {
    const program = updater
      .set('age', age => {
        if (age % 2) {
          return age + 2;
        }
        return age + 1;
      })
      .set('from.famous.people', (people, me) => {
        return [...people, me.name];
      });

    const result = program.run(person);
    expect(result.age).toBe(31);
    expect(result.from.famous.people).toEqual(['Jay-Z', 'Lady Gaga', 'John Smith']);
  });
});

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
  age: 30,
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
