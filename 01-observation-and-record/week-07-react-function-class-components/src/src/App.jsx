import { Component } from "react";
import Book from "./Book";

class App extends Component {
  render() {
    return (
      <div>
        <h3>Books</h3>
        <div className="library">
          <Book />
        </div>
      </div>
    );
  }
}

export default App;
