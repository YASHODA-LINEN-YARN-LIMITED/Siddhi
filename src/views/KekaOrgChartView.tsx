import React, { useState, useEffect } from 'react';
import {
  Network,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building2,
  Mail,
} from 'lucide-react';
import { api } from '../api.ts';

interface OrgNode {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  designation: string;
  department: string;
  status: string;
  email: string;
  directReportsCount: number;
  children: OrgNode[];
}

export const KekaOrgChartView: React.FC = () => {
  const [treeData, setTreeData] = useState<OrgNode | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await api.getOrgTree();
      setTreeData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: OrgNode, level: number = 0) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isMatched = search && (node.name.toLowerCase().includes(search.toLowerCase()) || node.designation.toLowerCase().includes(search.toLowerCase()));

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`w-64 rounded-xl border-2 p-3.5 shadow-2xs transition-all bg-white relative ${
            isMatched
              ? 'border-emerald-600 ring-2 ring-emerald-200 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shrink-0">
              {node.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-xs truncate">{node.name}</div>
              <div className="text-2xs text-slate-500 truncate">{node.designation}</div>
              <div className="text-2xs text-slate-400 font-mono">{node.employeeCode} · {node.department}</div>
            </div>
          </div>

          {hasChildren && (
            <button
              onClick={() => toggleCollapse(node.id)}
              className="mt-2.5 w-full py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-2xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <span>{node.directReportsCount} Direct Reports</span>
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Tree Connectors & Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="flex items-start justify-center gap-8 relative pt-2 border-t-2 border-slate-300">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-slate-300" />
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Org Tree
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs text-xs">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none text-xs bg-transparent placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Org Tree Canvas */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 overflow-x-auto min-h-[500px] flex justify-center shadow-inner">
        {loading || !treeData ? (
          <div className="flex items-center justify-center text-xs text-slate-400">
            Generating organizational hierarchy tree...
          </div>
        ) : (
          renderNode(treeData)
        )}
      </div>
    </div>
  );
};
