import { memo, useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { algorithmNodeLayout, algorithmRelations } from "../../data/algorithmAtlas";
import { learningPaths } from "../../lib/catalog";
import type { PathStats } from "./types";

type AlgorithmNodeData = {
  code: string;
  description: string;
  name: string;
  related: boolean;
  stats: PathStats;
} & Record<string, unknown>;

type AlgorithmFlowNode = Node<AlgorithmNodeData, "algorithm">;

const AlgorithmNode = memo(function AlgorithmNode({ data, selected }: NodeProps<AlgorithmFlowNode>) {
  return (
    <div className={`algorithm-node${selected ? " is-selected" : data.related ? " is-related" : ""}`}>
      <Handle className="algorithm-handle" type="target" position={Position.Left} isConnectable={false} />
      <span className="algorithm-node__code">{data.code}</span>
      <strong>{data.name}</strong>
      <small>{data.stats.total.toLocaleString()} 题 / {data.stats.solved} 完成</small>
      <Handle className="algorithm-handle" type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
});

const nodeTypes = { algorithm: AlgorithmNode };

export function AlgorithmMap({
  pathStats,
  selectedPath,
  onSelectPath
}: {
  pathStats: ReadonlyMap<string, PathStats>;
  selectedPath: string;
  onSelectPath: (slug: string) => void;
}) {
  const relatedSlugs = useMemo(() => new Set(algorithmRelations.flatMap((relation) => {
    if (relation.source === selectedPath) return [relation.target];
    if (relation.target === selectedPath) return [relation.source];
    return [];
  })), [selectedPath]);

  const nodes = useMemo<AlgorithmFlowNode[]>(() => learningPaths.map((path) => ({
    id: path.slug,
    type: "algorithm",
    position: algorithmNodeLayout[path.slug],
    selected: path.slug === selectedPath,
    ariaLabel: `${path.name}，${pathStats.get(path.slug)?.total ?? 0} 道题`,
    data: {
      code: algorithmNodeLayout[path.slug].code,
      description: path.description,
      name: path.name,
      related: relatedSlugs.has(path.slug),
      stats: pathStats.get(path.slug) ?? { total: 0, attempted: 0, solved: 0 }
    }
  })), [pathStats, relatedSlugs, selectedPath]);

  const edges = useMemo<Edge[]>(() => algorithmRelations.map((relation) => {
    const active = relation.source === selectedPath || relation.target === selectedPath;
    return {
      id: `${relation.source}-${relation.target}`,
      source: relation.source,
      target: relation.target,
      type: "smoothstep",
      label: active ? relation.label : undefined,
      animated: active,
      className: active ? "algorithm-edge is-active" : "algorithm-edge",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: active ? "var(--color-primary)" : "var(--color-border-strong)"
      },
      style: {
        stroke: active ? "var(--color-primary)" : "var(--color-border-strong)",
        strokeWidth: active ? 1.8 : 1
      }
    };
  }), [selectedPath]);

  const handleNodeClick = useCallback((_: unknown, node: AlgorithmFlowNode) => {
    onSelectPath(node.id);
  }, [onSelectPath]);

  const handleInit = useCallback((instance: ReactFlowInstance<AlgorithmFlowNode, Edge>) => {
    window.requestAnimationFrame(() => {
      if (window.innerWidth < 700) {
        void instance.setCenter(210, 220, { zoom: 0.82, duration: 0 });
      } else {
        void instance.fitView({ padding: 0.08, duration: 0 });
      }
    });
  }, []);

  return (
    <div className="algorithm-map" role="region" aria-label="可探索的算法题型关系图">
      <ReactFlow<AlgorithmFlowNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onInit={handleInit}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.55}
        maxZoom={1.45}
        panOnScroll
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
