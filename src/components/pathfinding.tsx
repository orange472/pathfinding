import React from "react";
import { CSSTransition } from "react-transition-group";
import $ from "jquery";

import "./pathfinding.css";
import { ReactComponent as PenIcon } from "../assets/icons/pen.svg";
import { ReactComponent as PlayIcon } from "../assets/icons/play.svg";

const constants = {
  types: {
    EMPTY: "EMPTY",
    WALL: "WALL",
    START: "START",
    TARGET: "TARGET",
    SHORTEST: "SHORTEST",
  },
  clickedColors: {
    EMPTY: "#f2f2f2",
    WALL: "#be41c3",
    START: "#ffd7b8",
    TARGET: "#a1cd22",
    SHORTEST: "#fcba03",
  },
};

type Cell = {
  row: number;
  col: number;
  distance: number;
  totalDistance: number;
  isVisited: boolean;
  isShortest: boolean;
  previousNode: Cell | null;
};

export default function Pathfinding(props: any) {
  const [selectedType, setType] = React.useState(constants.types.EMPTY);
  const [showControls, setShowControls] = React.useState(false);
  const [mouseDown, setMouseDown] = React.useState(false);
  const [start, setStart] = React.useState(false);
  const [message, setMessage] = React.useState(
    "Click the pen to edit then play to start!"
  );

  const [board] = React.useState<Cell[][]>([]);

  const handleClick = (e: { target: any }) => {
    if (!start) {
      changeColor(e.target);
    }
  };

  const handleMouseMove = (e: { target: any }) => {
    if (mouseDown && !start) {
      changeColor(e.target);
    }
  };

  const changeColor = (element: HTMLElement) => {
    var type: keyof typeof constants.types;
    const style = element.style,
      classes = element.classList,
      clearClasses = () => {
        for (type in constants.types) {
          classes.remove(type);
        }
      },
      setStartNode = () => {
        $(".START").css("background-color", `${constants.clickedColors.EMPTY}`);
        $(".START").removeClass("START");
      },
      setTargetNode = () => {
        $(".TARGET").css(
          "background-color",
          `${constants.clickedColors.EMPTY}`
        );
        $(".TARGET").removeClass("TARGET");
      },
      currentType = classes[classes.length - 1];

    // update clicked cell
    clearClasses();

    if (
      (currentType === selectedType && !mouseDown) ||
      selectedType === "EMPTY"
    ) {
      style.backgroundColor = constants.clickedColors.EMPTY;
      classes.add("EMPTY");
    } else if (selectedType === "WALL") {
      style.backgroundColor = constants.clickedColors.WALL;
      classes.add("WALL");
    } else if (selectedType === "START") {
      setStartNode();
      style.backgroundColor = constants.clickedColors.START;
      classes.add("START");
    } else if (selectedType === "TARGET") {
      setTargetNode();
      style.backgroundColor = constants.clickedColors.TARGET;
      classes.add("TARGET");
    }
  };

  const createBoard = () => {
    for (var i = 0; i < 10; i++) {
      board[i] = [];
      for (var j = 0; j < 10; j++) {
        board[i][j] = {
          row: i,
          col: j,
          distance: Infinity,
          totalDistance: Infinity,
          isVisited: false,
          isShortest: false,
          previousNode: null,
        };
      }
    }

    return board.map((_row: any, i: any) => {
      return (
        <tr key={i} id={"row " + i} className={"tableRow"}>
          {board[i].map((_col: any, j: any) => {
            var cornerCSS: string = "",
              height: number = board.length - 1,
              width: number = board[0].length - 1;
            if (i === 0 && j === 0) {
              cornerCSS = "topLeft";
            } else if (i === 0 && j === width) {
              cornerCSS = "topRight";
            } else if (i === height && j === 0) {
              cornerCSS = "bottomLeft";
            } else if (i === height && j === width) {
              cornerCSS = "bottomRight";
            }

            return (
              <td
                key={i + "-" + j}
                className={`${"tableCell"} ${cornerCSS} EMPTY`}
                id={i + "-" + j}
                onClick={handleClick}
                draggable={false}
                onMouseDown={() => {
                  setMouseDown(true);
                }}
                onMouseUp={() => {
                  setMouseDown(false);
                }}
                onMouseMove={handleMouseMove}
              />
            );
          })}
        </tr>
      );
    });
  };

  const astar = (board: any, startNode: any, endNode: any) => {
    if (!startNode || !endNode) return false;

    var openList: Cell[] = [];
    var closedList: Cell[] = [];
    startNode.distance = 0;
    openList.push(startNode);

    while (openList.length > 0) {
      openList.sort((a, b) => a.totalDistance - b.totalDistance);

      var closestNode = openList.shift();
      if (closestNode === undefined) break;
      if (closestNode === endNode) return closedList;

      closestNode.isVisited = true;
      closedList.push(closestNode);

      var neighbours = getNeighbours(closestNode, board);
      for (var neighbour of neighbours) {
        var distance = closestNode.distance + 1;
        if (!isNeighbourInOpenList(neighbour, openList)) {
          openList.unshift(neighbour);
          neighbour.distance = distance;
          neighbour.totalDistance =
            distance + getManhattanDistance(neighbour, endNode);
          neighbour.previousNode = closestNode;
        } else if (distance < neighbour.distance) {
          neighbour.distance = distance;
          neighbour.totalDistance =
            distance + getManhattanDistance(neighbour, endNode);
          neighbour.previousNode = closestNode;
        }
      }
    }
    return new Error("Could not reach the target node!");
  };

  const getNeighbours = (node: Cell, board: Cell[][]) => {
    var neighbours: Cell[] = [];
    var { row, col } = node;
    if (row !== 0) neighbours.push(board[row - 1][col]);
    if (col !== board[0].length - 1) neighbours.push(board[row][col + 1]);
    if (row !== board.length - 1) neighbours.push(board[row + 1][col]);
    if (col !== 0) neighbours.push(board[row][col - 1]);

    return neighbours.filter((neighbour) => {
      var isWall = false,
        x = neighbour.row,
        y = neighbour.col,
        ID = x + "-" + y,
        classString = $("#" + ID).attr("class");
      if (classString) {
        var classList = classString.split(" ");
        isWall = classList[classList.length - 1] === "WALL";
      } else {
        isWall = false;
      }

      return !(isWall || neighbour.isVisited);
    });
  };

  const getManhattanDistance = (node: any, endNode: any) => {
    var x = Math.abs(node.row - endNode.row);
    var y = Math.abs(node.col - endNode.col);
    return x + y;
  };

  const isNeighbourInOpenList = (neighbour: any, openList: any) => {
    for (var node in openList) {
      if (
        openList[node].row === neighbour.row &&
        openList[node].col === neighbour.col
      ) {
        return true;
      }
    }
    return false;
  };

  const getShortestPath = (endNode: Cell) => {
    var path: Cell[] = [];
    var count = 1;
    var currentNode: Cell | null = endNode;

    while (currentNode != null) {
      path.unshift(currentNode);
      currentNode.isShortest = true;
      currentNode = currentNode.previousNode;

      if (count > 100) break;
      count++;
    }

    return path;
  };

  const animateShortestPath = (path: any[], i: number) => {
    setTimeout(() => {
      var node = path[i],
        x = node.row,
        y = node.col,
        ID = x + "-" + y;
      if (node.isShortest && node.isVisited && node.previousNode != null) {
        $("#" + ID).css(
          "background-color",
          `${constants.clickedColors.SHORTEST}`
        );
        $("#" + ID).addClass("SHORTEST");
      }
      return;
    }, 100 * i);
  };

  const clearShortestPath = () => {
    $(".SHORTEST").each((i, element) => {
      $(element).css("background-color", `${constants.clickedColors.EMPTY}`);
      $(element).removeClass("SHORTEST");
    });
  };

  React.useEffect(() => {
    var startID = $(".START").attr("id");
    var endID = $(".TARGET").attr("id");
    if (startID && endID) {
      var startCoordinates = startID.split("-");
      var endCoordinates = endID.split("-");
      var startX = parseInt(startCoordinates[0]),
        startY = parseInt(startCoordinates[1]);
      var endX = parseInt(endCoordinates[0]),
        endY = parseInt(endCoordinates[1]);
      var startNode = board[startX][startY];
      var endNode = board[endX][endY];
      astar(board, startNode, endNode);
    } else {
      setStart(false);
      return;
    }

    if (start) {
      clearShortestPath();
      var path = getShortestPath(endNode);
      for (var i = 0; i < path.length; i++) {
        animateShortestPath(path, i);
      }
      setTimeout(() => setStart(false), i * 100);
      setMessage(
        path.length <= 1
          ? "You'll never catch me alive!"
          : `Distance: ${path.length} blocks (inclusive)`
      );
    }
  }, [start, board]);

  return (
    <div className="pathfinding-container">
      <div className={"canvas-container"}>
        {!start && (
          <PlayIcon
            className={"playIcon"}
            onClick={() => setStart(true)}
            onMouseUp={() => setMouseDown(false)}
          />
        )}
        <PenIcon
          className={"penIcon"}
          onClick={() => setShowControls(!showControls)}
          onMouseUp={() => setMouseDown(false)}
        />
        <CSSTransition
          in={showControls}
          mountOnEnter
          unmountOnExit
          timeout={{
            appear: 0,
            enter: 1000,
            exit: 100,
          }}
          classNames={{
            enter: "controlPanelEnter",
            enterActive: "controlPanelEnterActive",
            enterDone: "controlPanelEnterDone",
            exit: "controlPanelExit",
            exitActive: "controlPanelExitActive",
            exitDone: "controlPanelExitDone",
          }}
        >
          <div className={"controlPanel"} onMouseUp={() => setMouseDown(false)}>
            {/** MAYBE SHORTEN FOLLOWING CODE WITH A MAP FUNCTION */}
            <div className={showControls ? "control" : "hidden"}>
              Eraser
              <button
                className={"changeTypeButton"}
                style={{
                  background: `${constants.clickedColors.EMPTY}`,
                  filter: `${
                    selectedType === "EMPTY"
                      ? "brightness(0.9)"
                      : "brightness(1)"
                  }`,
                }}
                onClick={() => setType(constants.types.EMPTY)}
              />
            </div>
            <div className={showControls ? "control" : "hidden"}>
              Wall
              <button
                className={"changeTypeButton"}
                style={{
                  background: `${constants.clickedColors.WALL}`,
                  filter: `${
                    selectedType === "WALL"
                      ? "brightness(0.9)"
                      : "brightness(1)"
                  }`,
                }}
                onClick={() => setType(constants.types.WALL)}
              />
            </div>
            <div className={showControls ? "control" : "hidden"}>
              Start
              <button
                className={"changeTypeButton"}
                style={{
                  background: `${constants.clickedColors.START}`,
                  filter: `${
                    selectedType === "START"
                      ? "brightness(0.9)"
                      : "brightness(1)"
                  }`,
                }}
                onClick={() => setType(constants.types.START)}
              />
            </div>
            <div className={showControls ? "control" : "hidden"}>
              Target
              <button
                className={"changeTypeButton"}
                style={{
                  background: `${constants.clickedColors.TARGET}`,
                  filter: `${
                    selectedType === "TARGET"
                      ? "brightness(0.9)"
                      : "brightness(1)"
                  }`,
                }}
                onClick={() => setType(constants.types.TARGET)}
              />
            </div>
          </div>
        </CSSTransition>

        <table className={"tableContainer"}>{createBoard()}</table>
      </div>

      <div className="message-container">
        <p>{message}</p>
      </div>
    </div>
  );
}
