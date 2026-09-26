import { Parent } from '../models/Parent.js';

/**
 * Finds a parent by email or creates/updates their profile.
 * @param {Object} parentData - { name, email, timezone }
 * @returns {Promise<Object>}
 */
export const findOrCreateParent = async ({ name, email, timezone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  return Parent.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: name.trim(),
        timezone: timezone.trim(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const findParentById = async (parentId) => {
  return Parent.findById(parentId).lean();
};

export default {
  findOrCreateParent,
  findParentById,
};
