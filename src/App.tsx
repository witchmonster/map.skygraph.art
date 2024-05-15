import GraphContainer from "./components/Graph";
import "./App.css";
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";


const fetchLayoutURL = (layoutName: string, isSubLayout: boolean): string => {
  return `./exporter/out/layouts/${isSubLayout ? "sub_layouts/" : ""}${layoutName}_layout.json`
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <GraphContainer fetchLayoutURL={fetchLayoutURL} />
      </>
    ),
  },
  // {
  //   path: "/sublayout",
  //   element: (
  //     <>
  //       <GraphContainer fetchLayoutURL={fetchSubLayoutURL} />
  //     </>
  //   ),
  // }
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
