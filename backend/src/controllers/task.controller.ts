import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Task, task_status, task_priority } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../types/api.types';

const prisma = new PrismaClient();

// Get all tasks for the authenticated employee
export const getAllTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = req.admin?.id;
    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const status = req.query.status as task_status | undefined;
    const priority = req.query.priority as task_priority | undefined;

    const where: any = { employeeId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse<Task[]> = {
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get all tasks for admin oversight (super admin only)
export const getAllTasksAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.admin?.role;
    if (role !== 'super_admin') {
      throw new AppError('Forbidden: Super Admin access required', 403);
    }

    const status = req.query.status as task_status | undefined;
    const priority = req.query.priority as task_priority | undefined;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (employeeId) where.employeeId = employeeId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch admin data separately for enrichment (employeeId stores admin ID)
    const adminIds = [...new Set(tasks.map(t => t.employeeId))];
    const admins = await prisma.admins.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, username: true, name: true, role: true },
    });

    // Merge admin data into tasks
    const tasksWithAdmin = tasks.map(task => {
      const admin = admins.find((a: { id: number }) => a.id === task.employeeId);
      return {
        ...task,
        admin: admin || null,
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      message: 'All tasks retrieved successfully',
      data: tasksWithAdmin,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID
export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const response: ApiResponse<Task> = {
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Create a new task
export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = req.admin?.id;
    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const { title, description, priority, dueDate, labels } = req.body;

    if (!title || title.trim() === '') {
      throw new AppError('Title is required', 400);
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels || [],
        employeeId,
        status: 'todo',
        totalTimeSpent: 0,
        isTimerRunning: false,
      },
    });

    const response: ApiResponse<Task> = {
      success: true,
      message: 'Task created successfully',
      data: task,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Update a task
export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const existingTask = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const { title, description, status, priority, dueDate, labels } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels !== undefined) updateData.labels = labels;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const response: ApiResponse<Task> = {
      success: true,
      message: 'Task updated successfully',
      data: task,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Delete a task
export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const existingTask = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Task deleted successfully',
      data: null,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Start timer for a task
export const startTimer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    // Check if any other task has an active timer for this employee
    const activeTimerTask = await prisma.task.findFirst({
      where: {
        employeeId,
        isTimerRunning: true,
        id: { not: parseInt(id) },
      },
    });

    if (activeTimerTask) {
      throw new AppError('Another task already has an active timer. Please stop it first.', 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.isTimerRunning) {
      throw new AppError('Timer is already running for this task', 400);
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        isTimerRunning: true,
        lastTimerStart: new Date(),
      },
    });

    const response: ApiResponse<Task> = {
      success: true,
      message: 'Timer started',
      data: updatedTask,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Stop timer for a task
export const stopTimer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (!task.isTimerRunning || !task.lastTimerStart) {
      throw new AppError('Timer is not running for this task', 400);
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - task.lastTimerStart.getTime()) / 1000);
    const newTotalTime = task.totalTimeSpent + elapsedSeconds;

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        isTimerRunning: false,
        lastTimerStart: null,
        totalTimeSpent: newTotalTime,
      },
    });

    const response: ApiResponse<Task> = {
      success: true,
      message: 'Timer stopped',
      data: updatedTask,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get timer status for a task
export const getTimerStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.admin?.id;

    if (!employeeId) {
      throw new AppError('Unauthorized', 401);
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(id), employeeId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    let currentElapsed = 0;
    if (task.isTimerRunning && task.lastTimerStart) {
      currentElapsed = Math.floor((new Date().getTime() - task.lastTimerStart.getTime()) / 1000);
    }

    const response: ApiResponse<{
      isRunning: boolean;
      totalTimeSpent: number;
      currentElapsed: number;
      totalDisplay: number;
    }> = {
      success: true,
      message: 'Timer status retrieved',
      data: {
        isRunning: task.isTimerRunning,
        totalTimeSpent: task.totalTimeSpent,
        currentElapsed,
        totalDisplay: task.totalTimeSpent + currentElapsed,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
