/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import useStyles from 'isomorphic-style-loader/useStyles';
import React from 'react';
import PropTypes from 'prop-types';
import s from './Home.css';
import { game, range, N, pvsToArray } from './game'

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

export default () => <Home game={game} />;
