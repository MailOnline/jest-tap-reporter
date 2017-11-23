test('foo succeeds', () => {

});

test('bar fails', () => {
  throw new Error('bar closed');
});

// Successful no-namer test.
test('', () => {});

// Failed no-namer test.
// eslint-disable-next-line jest/no-identical-title
test('', () => {
  throw new TypeError('Unknown error occured.');
});

// eslint-disable-next-line jest/no-disabled-tests
test('skipped test');

// eslint-disable-next-line jest/no-disabled-tests
xit('a sample todo test', () => {});

describe('Foobar', () => {
  test('sample test that succeeds', () => {});

  test('static snapshot', () => {
    expect('static text').toMatchSnapshot();
  });

  test('snapshot that always changes', () => {
    expect({
      time: Date.now()
    }).toMatchSnapshot();
  });
});
