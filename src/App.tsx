import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { CatalogPage } from "./pages/CatalogPage";

const WorkspacePage = lazy(() => import("./pages/WorkspacePage").then((module) => ({ default: module.WorkspacePage })));

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Routes>
      <Route path="/" element={<CatalogPage key="catalog" section="catalog" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/paths" element={<CatalogPage key="paths" section="paths" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/progress" element={<CatalogPage key="progress" section="progress" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/problems/:slug" element={(
        <Suspense fallback={<div className="route-loading">正在加载练习工作台...</div>}>
          <WorkspacePage theme={theme} onToggleTheme={toggleTheme} />
        </Suspense>
      )} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
