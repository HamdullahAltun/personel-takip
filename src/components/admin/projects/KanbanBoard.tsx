
"use client";

import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface KanbanBoardProps {
    data: any; // Project data with columns and tasks
    onTaskMove: (taskId: string, sourceColId: string, destColId: string, newIndex: number) => Promise<void>;
    onAddTask: (columnId: string) => void;
    onTaskClick: (task: any) => void;
}

export default function KanbanBoard({ data, onTaskMove, onAddTask, onTaskClick }: KanbanBoardProps) {
    const [columns, setColumns] = useState(data.columns);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceColIndex = columns.findIndex((col: any) => col.id === source.droppableId);
        const destColIndex = columns.findIndex((col: any) => col.id === destination.droppableId);

        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];

        const sourceTasks = Array.from(sourceCol.tasks);
        const destTasks = Array.from(destCol.tasks);

        // Remove from source
        const [movedTask] = sourceTasks.splice(source.index, 1);

        // Add to destination
        if (source.droppableId === destination.droppableId) {
            sourceTasks.splice(destination.index, 0, movedTask);
            const newCol = { ...sourceCol, tasks: sourceTasks };
            const newColumns = [...columns];
            newColumns[sourceColIndex] = newCol;
            setColumns(newColumns);
        } else {
            destTasks.splice(destination.index, 0, movedTask);
            const newSourceCol = { ...sourceCol, tasks: sourceTasks };
            const newDestCol = { ...destCol, tasks: destTasks };
            const newColumns = [...columns];
            newColumns[sourceColIndex] = newSourceCol;
            newColumns[destColIndex] = newDestCol;
            setColumns(newColumns);
        }

        // Optimistic UI update done, now call API
        try {
            await onTaskMove(draggableId, source.droppableId, destination.droppableId, destination.index);
        } catch (error) {
            toast.error("Görev taşınamadı.");
            // Revert state if needed (omitted for brevity)
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto h-[calc(100vh-250px)] gap-6 pb-4 items-start">
                {columns.map((column: any) => (
                    <div key={column.id} className="min-w-[300px] w-[300px] bg-slate-50 rounded-2xl p-4 flex flex-col max-h-full border border-slate-200/60">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-700">{column.title}</h3>
                                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {column.tasks.length}
                                </span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto min-h-[100px] space-y-3 px-1 py-1 ${snapshot.isDraggingOver ? "bg-indigo-50/50 rounded-xl" : ""
                                        }`}
                                >
                                    {column.tasks.map((task: any, index: number) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            index={index}
                                            onClick={() => onTaskClick(task)}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <button
                            onClick={() => onAddTask(column.id)}
                            className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:bg-white hover:shadow-sm hover:text-indigo-600 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-slate-100"
                        >
                            <Plus className="w-4 h-4" />
                            Görev Ekle
                        </button>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
