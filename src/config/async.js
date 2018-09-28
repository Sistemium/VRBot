import eachSeries from 'async/eachSeries';
import whilst from 'async/whilst';

export async function eachSeriesAsync(arr, fn) {

  return new Promise((resolve, reject) => {

    eachSeries(arr, fn, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });

  });

}

export async function whilstAsync(filter, fn) {

  return new Promise((resolve, reject) => {

    whilst(filter, fn, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });

  });

}
