const N = 6;
const range = (n = N) => [...Array(n).keys()];
const flatten = arr => {
  let result = []
  arr.forEach(v => {
    if (Array.isArray(v)) result = result.concat(flatten(v))
    else result.push(v)
  })
  return result
}
console.log(flatten([2,3,[4,5,[6,7,[8,9]]]]))
class Game {
  constructor(clues) {
    this.clues = clues;
    this.data = flatten(range().map(
      () => range().map(
        () => [arrayToPvs(range().map(v => v + 1)), 0]
      )
    ))
    global.game = this;
  }

  cell(i, j, value) {
    const index = 2 * (i * N + j);
    if (value === undefined) {
      return [this.data[index], this.data[index + 1]];
    }
    [this.data[index], this.data[index + 1]] = value;
  }

  row(i, value) {
    if (value === undefined) {
      return flatten(range().map(j => this.cell(i, j)));
    }
    range().forEach(j => {
      this.cell(i, j, [value[2 * j], value[2 * j + 1]]);
    });
  }

  col(j, value) {
    if (value === undefined) {
      return flatten(range().map(i => this.cell(i, j)));
    }
    range().forEach(i => {
      this.cell(i, j, [value[2 * i], value[2 * i + 1]]);
    });
  }

  rowOrCol(k, isRow, value) {
    return isRow ? this.row(k, value) : this.col(k, value);
  }

  rowClues(i) {
    return { start: this.clues[N * 4 - 1 - i], end: this.clues[N + i] };
  }

  colClues(j) {
    return { start: this.clues[j], end: this.clues[N * 3 - 1 - j] };
  }

  rowOrColClues(k, isRow) {
    return isRow ? this.rowClues(k) : this.colClues(k);
  }

  solve(k, isRow) {
    const { changed, result } = solve(
      this.rowOrCol(k, isRow),
      this.rowOrColClues(k, isRow),
    );
    this.rowOrCol(k, isRow, result);
    return { changed, result };
  }

  solveAll() {
    let changedSome = false;
    range().forEach(k =>
      [true, false].forEach(isRow => {
        const { changed, result } = this.solve(k, isRow);
        if (changed) {
          changedSome = true;
        }
      }),
    );
    console.log('changed', changedSome);
    if (changedSome) {
      this.solveAll();
    }
  }
}

const log = x => {
  let r = -1;
  while (x) {
    x >>= 1;
    r++;
  }
  return r;
};
global.log = log;
const pvsToArray = pvs =>
  range()
    .map(k => ((1 << (k + 1)) & pvs ? k + 1 : null))
    .filter(Boolean);
const arrayToPvs = array => array.reduce((s, v) => s + (1 << v), 0);
const mapPvs = (pvs, callback) => arrayToPvs(callback(pvsToArray(pvs)));

const reverseArr = arr =>
  flatten(range().map(k => [arr[(N - k) * 2 - 2], arr[(N - k) * 2 - 1]]));

const eliminateAlones = arr => {
  const allPvs = {};
  for (let k = 0; k < N; k++) {
    for (let pv = 1; pv <= N; pv++) {
      if (arr[k * 2] & (1 << pv)) allPvs[pv] = (allPvs[pv] || 0) + (1 << k);
    }
  }
  Object.entries(allPvs).forEach(([pv, kk]) => {
    if ((kk & (kk - 1)) === 0) {
      const index = 2 * log(kk);
      arr[index] = 1 << pv;
      arr[index + 1] = Number(pv);
    }
  });

  let index;
  do {
    index = -1;
    for (let k = 0; k < N; k++) {
      const k2 = k * 2;
      if ((arr[k2] & (arr[k2] - 1)) === 0 && !arr[k2 + 1]) {
        index = k2;
        arr[k2 + 1] = log(arr[k2]);
        for (let c = 0; c < N; c++) {
          if (c !== k) {
            arr[c * 2] &= ~arr[k2];
          }
        }
        break;
      }
    }
  } while (index > -1);
};

const eliminateValues = arr => {
  let value
  for(let k = 0; k < N; k++) {
    value = arr[k * 2 + 1]
    if (value) {
      for(let c = 0; c < N; c++) {
        if (c === k) continue
        let t = arr[c * 2]
        arr[c * 2] &= ~(1 << value)
      }
    }
  }
  return arr
}

const checkAscending = (arr, clue) => {
  let result = arr;
  if (result[(clue - 1) * 2 + 1] === N) {
    let min = 0
    for (let k = 0; k < clue - 1; k++) {
      if (k > 0) {
        result[k * 2] = mapPvs(result[k * 2], pvs => pvs.filter(pv => pv > min))
      }
      min = Math.min(...pvsToArray(result[k * 2]))
    }
  }
  return result
};

const withReverse = (arr, clues, callback) => {
  let result = arr;
  if (clues.start) {
    result = callback(result, clues.start);
  }
  if (clues.end) {
    result = reverseArr(callback(reverseArr(result), clues.end));
  }
  return result;
};

const I = 4
let i = 0
const debugSteps = false
const solve = (arr, clues) => {
  let result = arr;
  const copy = [...arr];

  if (!debugSteps || i % I === 3) {
    if (debugSteps) console.log('solveLeft')
  result = withReverse(result, clues, (arr, clue) => solveLeft(arr, clue));
  }

  if (!debugSteps || i % I === 1) {
    if (debugSteps) console.log('eliminateAlones')
  eliminateAlones(result);
  }

  if (!debugSteps || i % I === 2) {
    if (debugSteps) console.log('checkAscending')
  result = withReverse(result, clues, (arr, clue) => checkAscending(arr, clue));
  }

  if (!debugSteps || i % I === 3) {
    if (debugSteps) console.log('eliminateValues')
  eliminateValues(result)
  }

  let changed = false;
  for (let k = 0; k < 2 * N; k++) {
    if (result[k] !== copy[k]) {
      changed = true;
      break;
    }
  }
  i++

  return { changed, result }
};

const solveLeft = (arr, clue) => {
  const result = arr;
  if (clue) {
    for (let k = 0; k < clue - 1; k++) {
      result[k * 2] = mapPvs(result[k * 2], pvs =>
        pvs.filter(v => v <= N + 1 - clue + k),
      );
    }
  }
  return result;
};

const toDebug = arr => range().map(k => pvsToArray(arr[k * 2]).join('').concat(arr[k * 2 + 1] ? ` [${arr[k * 2 + 1]}]` : ''))

const fromDebug = arr => arr.flatMap(s => {
  const pvs = s.split('')
  return [arrayToPvs(pvs), pvs.length === 1 ? Number(pvs) : 0]
})

const clues = [ 0, 0, 0, 2, 2, 0, 0, 0, 0, 6, 3, 0, 0, 4, 0, 0, 0, 0, 4, 4, 0, 3, 0, 0 ]
const game = new Game(clues)
// game.solveAll()

const solvePuzzle = clues => {
  const game = new Game(clues)
  game.solveAll()
  return range().map(i => range().map(j => game.data[2 * (N * i + j) + 1]))
}
console.log(solvePuzzle(clues))

export { game, range, N, pvsToArray }