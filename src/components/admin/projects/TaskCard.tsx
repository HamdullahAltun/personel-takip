
"use client";

import { Draggable } from "@hello-pangea/dnd";
import { User as UserIcon, Calendar, MoreHorizontal, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TaskCardProps {
    task: any;
    index: number;
    onClick?: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
    const priorityColors = {
        LOW: "bg-slate-100 text-slate-600",
        MEDIUM: "bg-blue-100 text-blue-600",
        HIGH: "bg-orange-100 text-orange-600",
        URGENT: "bg-red-100 text-red-600"
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    style={{ ...provided.draggableProps.style }}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer ${snapshot.isDragging ? "shadow-lg ring-2 ring-indigo-500/20 rotate-2" : ""
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM}`}>
                            {task.priority || "NORMAL"}
                        </span>
                        <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{task.title}</h4>

                    {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                        <div className="flex items-center -space-x-2">
                            {task.assignedTo ? (
                                task.assignedTo.profilePicture ? (
                                    <img src={task.assignedTo.profilePicture} alt={task.assignedTo.name} className="w-6 h-6 rounded-full border-2 border-white" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                        {task.assignedTo.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                    <UserIcon className="w-3 h-3 text-slate-400" />
                                </div>
                            )}
                        </div>

                        {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? "text-red-500" : "text-slate-400"
                                }`}>
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(task.dueDate), "d MMM", { locale: tr })}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
