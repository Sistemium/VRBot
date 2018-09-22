// eslint-disable-next-line
export function countableState(count = 0) {

  if (count % 100 >= 10 && count % 100 <= 20) {
    return 'w50';
  }

  const lastDigit = count % 10;

  if (lastDigit === 1) {
    return 'w1';
    // eslint-disable-next-line
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return 'w24';
  }

  return 'w50';

}
