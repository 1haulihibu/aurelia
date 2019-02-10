import { expect } from 'chai';
import { Reporter } from '../src/index';

describe('The default Reporter', function () {
  it('creates an Error with a minimal message upon request', function () {
    const code = 42;
    const error = Reporter.error(code);
    expect(error.message).to.equal(`Code ${code}`);
  });
});
