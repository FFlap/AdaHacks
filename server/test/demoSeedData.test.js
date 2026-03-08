import { describe, expect, it } from 'vitest';
import { demoSeedPeople } from '../src/demoSeedData.js';

describe('demoSeedPeople', () => {
  it('contains exactly 20 unique builders with one project each', () => {
    expect(demoSeedPeople).toHaveLength(20);

    const fullNames = new Set(demoSeedPeople.map((person) => person.fullName));
    const projectNames = new Set(demoSeedPeople.map((person) => person.project.name));
    const emails = new Set(demoSeedPeople.map((person) => person.email));

    expect(fullNames.size).toBe(20);
    expect(projectNames.size).toBe(20);
    expect(emails.size).toBe(20);

    demoSeedPeople.forEach((person) => {
      expect(person.bio.length).toBeGreaterThan(0);
      expect(person.bio.length).toBeLessThanOrEqual(280);
      expect(person.skills.length).toBeGreaterThan(0);
      expect(person.skills.length).toBeLessThanOrEqual(16);
      expect(Object.keys(person.contactLinks).length).toBeGreaterThanOrEqual(1);
      expect(person.project).toBeTruthy();
      expect(person.project.description.length).toBeLessThanOrEqual(480);
      expect(person.project.techStack.length).toBeGreaterThan(0);
      expect(person.project.techStack.length).toBeLessThanOrEqual(16);
    });
  });
});
