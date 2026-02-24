const MedicalRecord = require("../models/MedicalRecord");
exports.createRecord = async (req, res) => {
    const { patientId, diagnosis, prescription, notes } = req.body;
    const record = await MedicalRecord.create({
        patient: patientId,
        doctor: req.user.id,
        diagnosis,
        prescription,
        notes
    });
    res.json(record);
};
exports.getRecords = async (req, res) => {
    const records = await MedicalRecord.find({
        patient: req.user.id
    }).populate("doctor");
    res.json(records);
};
//# sourceMappingURL=medicalController.js.map