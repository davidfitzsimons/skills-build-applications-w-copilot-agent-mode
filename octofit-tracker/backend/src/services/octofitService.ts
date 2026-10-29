import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveMinutes(value: unknown) {
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return Number.NaN;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity payload is required');

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (!isNonEmptyString(userId) || !mongoose.isValidObjectId(userId)) {
    throw badRequest('userId is required and must be a valid ObjectId');
  }
  if (!isNonEmptyString(teamId) || !mongoose.isValidObjectId(teamId)) {
    throw badRequest('teamId is required and must be a valid ObjectId');
  }
  const normalizedMinutes = parsePositiveMinutes(minutes);
  if (!isNonEmptyString(type) || !Number.isFinite(normalizedMinutes) || normalizedMinutes <= 0) {
    throw badRequest('type and a positive minutes value are required');
  }

  const user = await User.findById(userId);
  if (!user) throw badRequest('User not found for activity');

  const team = await Team.findById(teamId);
  if (!team) throw badRequest('Team not found for activity');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes: normalizedMinutes,
    points: Math.max(1, Math.round(normalizedMinutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team payload is required');

  const { name, mascot, members } = input as Record<string, unknown>;
  if (!isNonEmptyString(name)) throw badRequest('Team name is required');
  if (!isNonEmptyString(mascot)) throw badRequest('Team mascot is required');

  const memberIds = Array.isArray(members) ? members : [];
  const normalizedMembers: mongoose.Types.ObjectId[] = [];
  for (const memberId of memberIds) {
    if (!isNonEmptyString(memberId) || !mongoose.isValidObjectId(memberId)) {
      throw badRequest('Each member must be a valid ObjectId');
    }
    const user = await User.findById(memberId);
    if (!user) throw badRequest(`Member ${memberId} was not found`);
    normalizedMembers.push(new mongoose.Types.ObjectId(memberId));
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail?.trim();
  if (!normalizedEmail) {
    throw badRequest('A user email is required');
  }

  const user = await User.findOne({ email: normalizedEmail.toLowerCase() }).lean();
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const recentFocuses = new Set(recentActivity.map((activity) => String(activity.type).toLowerCase()));
  const goal = String(user.fitnessGoal ?? '').toLowerCase();

  const workouts = await Workout.find().lean();
  const ranked = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      let score = 0;
      if (focus === goal) score += 3;
      if (recentFocuses.has(focus)) score += 2;
      if (goal.includes(focus) || focus.includes(goal)) score += 1;
      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title));

  if (ranked.length === 0) {
    return [];
  }

  return ranked.map(({ workout }) => {
    const focus = String(workout.focus ?? '').toLowerCase();
    const reason = recentFocuses.has(focus)
      ? `Your recent ${Array.from(recentFocuses).join(', ')} activity and ${goal || 'fitness'} goal make ${focus} a strong fit.`
      : `Your ${goal || 'fitness'} goal makes ${focus} a great next step.`;

    return {
      ...workout,
      reason,
    };
  });
}

export { User };
