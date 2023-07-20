import { generateRecordUpdater } from '../src';
import { describe, test, expect } from 'vitest';

describe('test of generateRecordUpdater', () => {
  const updater = generateRecordUpdater<Person, ErrKind>(person => person.age >= 10 || 'AgeIsLessThanTen');

  test('if age < 10 then throw error', () => {
    const result = updater.set('age', 8).run(person);
    if (result.success) {
      expect(true).toBeFalsy();
    } else {
      expect(result.errors).toEqual(['AgeIsLessThanTen']);
    }
  });

  test('if age is even then age+=1 else age+=2', () => {
    const program = updater.set('age', age => {
      if (age % 2) {
        return age + 2;
      }
      return age + 1;
    });
    const result = program.run(person);
    if (result.success) {
      expect(result.data.age).toBe(31);
    } else {
      expect(true).toBeFalsy();
    }
  });

  test('add person to from.famous.people', () => {
    const program = updater.set('from.famous.people', (people, pre) => {
      const me = pre();

      if (me.success) {
        return [...people, me.data.name];
      }
      return people;
    });
    const result = program.run(person);
    if (result.success) {
      expect(result.data.from.famous.people).toEqual(['Jay-Z', 'Lady Gaga', 'John Smith']);
    } else {
      expect(true).toBeFalsy();
    }
  });

  test('if age is even then age+=1 else age+=2, and then add person to from.famous.people', () => {
    const program = updater
      .set('age', age => {
        if (age % 2) {
          return age + 2;
        }
        return age + 1;
      })
      .set('from.famous.people', (people, pre) => {
        const me = pre();

        if (me.success) {
          return [...people, me.data.name];
        }
        return people;
      });

    const result = program.run(person);
    if (result.success) {
      expect(result.data.age).toBe(31);
      expect(result.data.from.famous.people).toEqual(['Jay-Z', 'Lady Gaga', 'John Smith']);
    } else {
      expect(true).toBeFalsy();
    }
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

type ErrKind = 'AgeIsLessThanTen';
