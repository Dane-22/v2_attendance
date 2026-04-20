'use client';

import { ProjectCost } from '../types';
import { formatCurrency } from '../data';
import { 
  HardHat, 
  CheckCircle2, 
  Clock, 
  PauseCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface ProjectCostsProps {
  projects: ProjectCost[];
}

const statusConfig = {
  ACTIVE: { icon: Clock, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Active' },
  COMPLETED: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Completed' },
  ON_HOLD: { icon: PauseCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'On Hold' },
};

export default function ProjectCosts({ projects }: ProjectCostsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
      <div className="p-6 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project Costs</h3>
              <p className="text-sm text-gray-400">{activeProjects.length} active projects</p>
            </div>
          </div>
          <button className="text-sm text-[#facc15] hover:text-yellow-400 transition-colors">
            View All Projects →
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#262626]">
        {projects.map((project) => {
          const status = statusConfig[project.status];
          const StatusIcon = status.icon;
          const isExpanded = expandedId === project.projectId;
          const budgetUsedPercentage = (project.spentToDate / project.totalBudget) * 100;

          return (
            <div 
              key={project.projectId}
              className="p-4 hover:bg-[#1a1a1a] transition-colors"
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(project.projectId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-medium text-white">{project.projectName}</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetUsedPercentage > 90 ? 'bg-red-400' :
                          budgetUsedPercentage > 75 ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">{project.progress}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(project.spentToDate)}
                    </p>
                    <p className="text-xs text-gray-400">
                      / {formatCurrency(project.totalBudget)}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-[#262626] rounded-lg transition-colors text-gray-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#0f0f0f] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Labor Costs</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(project.laborCosts)}</p>
                      <p className="text-xs text-gray-500">
                        {((project.laborCosts / project.spentToDate) * 100).toFixed(0)}% of spent
                      </p>
                    </div>
                    <div className="bg-[#0f0f0f] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Materials</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(project.materialCosts)}</p>
                      <p className="text-xs text-gray-500">
                        {((project.materialCosts / project.spentToDate) * 100).toFixed(0)}% of spent
                      </p>
                    </div>
                    <div className="bg-[#0f0f0f] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Other Costs</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(project.otherCosts)}</p>
                      <p className="text-xs text-gray-500">
                        {((project.otherCosts / project.spentToDate) * 100).toFixed(0)}% of spent
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-400">Project ID: </span>
                      <span className="text-white font-mono">{project.projectId}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Remaining Budget: </span>
                      <span className={`font-medium ${
                        project.totalBudget - project.spentToDate >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(project.totalBudget - project.spentToDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
