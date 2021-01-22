/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import _ from 'lodash';
import useStyles from 'isomorphic-style-loader/useStyles';
import React from 'react';
import PropTypes from 'prop-types';
import s from './Home.css';

// export default function Home({ news }) {
//   useStyles(s);
//   return (
//     <div className={s.root}>
//     </div>
//   );
// }

class CellClue extends React.Component {
  render() {
    const {
      isRow,
      index,
      hovered,
      onMouseOver,
      onMouseOut,
      onClick,
      value,
    } = this.props;
    return (
      <div
        className={`cell cell-clue ${
          hovered &&
          ((isRow && hovered.isRow) || (!isRow && !hovered.isRow)) &&
          hovered.index === index
            ? 'cell-clue-hover'
            : ''
        }`}
        onMouseOver={() => onMouseOver({ isRow, index })}
        onMouseOut={onMouseOut}
        onClick={onClick}
        key={index}
      >
        {value || ''}
      </div>
    );
  }
}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { game: props.game, hovered: null };
  }

  componentDidMount() {
    setInterval(() => this.setState(s => ({ ...s })), 300);
  }

  solve(num, isRow) {
    this.state.game.solve(num, isRow);
    this.setState(s => ({ ...s }));
  }

  solveWhile() {
    this.state.game.solveAll();
    this.setState(s => ({ ...s }));
  }

  setCell(i, j) {
    const value = Number(prompt());
    if (value) {
      Object.assign(this.state.game.grid[i][j], {
        value,
        pvs: [value],
      });
      this.solveWhile();
    }
  }

  render() {
    const { game, hovered } = this.state;
    return (
      <div className="container">
        <div className="table">
          <div className="row row-clue">
            <div className="cell" />
            {range(N).map(i => (
              <CellClue
                key={i}
                index={i}
                hovered={hovered}
                onMouseOver={hovered => this.setState({ hovered })}
                onMouseOut={() => this.setState({ hovered: null })}
                onClick={() => this.solve(i, false)}
                value={game.clues[i]}
              />
            ))}
            <div className="cell" />
          </div>
          {range().map(i => (
            <div
              className={`row row-content ${
                i === 0 ? 'row-first' : i === N - 1 ? 'row-last' : ''
              }`}
              key={i}
            >
              <CellClue
                isRow
                index={i}
                hovered={hovered}
                onMouseOver={hovered => this.setState({ hovered })}
                onMouseOut={() => this.setState({ hovered: null })}
                onClick={() => this.solve(i, true)}
                value={game.clues[N * 4 - 1 - i]}
              />
              {range().map(j => {
                const [pvs, value] = game.cell(i, j);
                return (
                  <div
                    key={j}
                    className={`cell cell-content ${value ? 'value' : 'pvs'} ${
                      j === 0 ? 'cell-first' : j === N - 1 ? 'cell-last' : ''
                    }`}
                    onClick={() => this.setCell(i, j)}
                  >
                    {value || pvsToArray(pvs)}
                    {/* {pvsToArray(pvs)} */}
                    {/* {value ? `[${value}]` : ''} */}
                  </div>
                );
              })}
              <CellClue
                isRow
                index={i}
                hovered={hovered}
                onMouseOver={hovered => this.setState({ hovered })}
                onMouseOut={() => this.setState({ hovered: null })}
                onClick={() => this.solve(i, true)}
                value={game.clues[N + i]}
              />
            </div>
          ))}
          <div className="row row-clue">
            <div className="cell" />
            {range(N).map(i => (
              <CellClue
                key={i}
                index={i}
                hovered={hovered}
                onMouseOver={hovered => this.setState({ hovered })}
                onMouseOut={() => this.setState({ hovered: null })}
                onClick={() => this.solve(i, false)}
                value={game.clues[N * 3 - 1 - i]}
              />
            ))}
            <div className="cell" />
          </div>
        </div>
        <button onClick={() => this.solveWhile()}>Click</button>
      </div>
    );
  }
}

const N = 6;
const range = (n = N) => [...Array(n).keys()];
class Game {
  data = _.flattenDeep(
    range().map(() =>
      range().map(() => [arrayToPvs(range().map(v => v + 1)), 0]),
    ),
  );

  constructor(clues) {
    this.clues = clues;
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
      return range().flatMap(j => this.cell(i, j));
    }
    range().forEach(j => {
      this.cell(i, j, [value[2 * j], value[2 * j + 1]]);
    });
  }

  col(j, value) {
    if (value === undefined) {
      return range().flatMap(i => this.cell(i, j));
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
  range().flatMap(k => [arr[(N - k) * 2 - 2], arr[(N - k) * 2 - 1]]);

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

const checkAscending = (arr, clue) => {
  return arr;
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

const solve = (arr, clues) => {
  let result = arr;
  const copy = [...arr];

  result = withReverse(result, clues, (arr, clue) => solveLeft(arr, clue));

  eliminateAlones(result);

  result = withReverse(result, clues, (arr, clue) => checkAscending(arr, clue));

  let changed = false;
  for (let k = 0; k < 2 * N; k++) {
    if (result[k] !== copy[k]) {
      changed = true;
      break;
    }
  }

  return { changed, result };
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

const clues = [
  0,
  0,
  0,
  2,
  2,
  0,
  0,
  0,
  0,
  6,
  3,
  0,
  0,
  4,
  0,
  0,
  0,
  0,
  4,
  4,
  0,
  3,
  0,
  0,
];
const game = new Game(clues);

export default () => <Home game={game} />;
