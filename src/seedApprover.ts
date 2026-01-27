import { Approver } from './models/Approver.js';

export const seedSuperApprover = async () => {
  const count = await Approver.countDocuments();

  if (count === 0) {
await Approver.create({
  name: 'Super Approver',
  phone: process.env.SUPER_APPROVER_PHONE!,
  position: 'System Administrator', 
  role: 'super',
  isActive: true,
});


    console.log('✅ Super Approver created');
  }
};
