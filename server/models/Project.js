const mongoose = require('mongoose');

const PinConnectionSchema = new mongoose.Schema({
  componentId: { type: String, required: true },
  pin: { type: String, required: true }
}, { _id: false });

const WireSchema = new mongoose.Schema({
  id: { type: String, required: true },
  from: { type: PinConnectionSchema, required: true },
  to: { type: PinConnectionSchema, required: true },
  color: { type: String, default: '#3b82f6' },
  points: { type: Array, default: [] }
}, { _id: false });

const ComponentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  z: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  components: [ComponentSchema],
  wires: [WireSchema],
  code: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  isPublic: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);

