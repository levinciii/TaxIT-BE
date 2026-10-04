import prisma from '../config/prisma.js';
import { notFound } from '../shared/errors.js';
import * as audit from './audit.service.js';

async function get(userId) {
  const row = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true } } },
  });
  if (!row) throw notFound('Profile not found');
  const { user, ...profile } = row;
  return { ...profile, email: user.email, onboardingComplete: Boolean(profile.tin) };
}

async function update(userId, input) {
  const data = {
    fullName: input.fullName,
    tin: input.tin ?? null,
    specialty: input.specialty ?? null,
    prcLicenseNo: input.prcLicenseNo ?? null,
    rdoCode: input.rdoCode ?? null,
    businessAddress: input.businessAddress ?? null,
    vatRegistered: input.vatRegistered,
    incomeTaxOption: input.incomeTaxOption,
  };
  await prisma.doctorProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  // Never log the TIN itself.
  await audit.log(userId, 'profile.update', 'doctor_profile', userId, {
    vatRegistered: input.vatRegistered,
    incomeTaxOption: input.incomeTaxOption,
  });
  return get(userId);
}

export { get, update };
