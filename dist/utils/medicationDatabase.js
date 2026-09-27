const medicationData = {
    paracetamol: {
        genericName: 'Acetaminophen',
        brandNames: ['Tylenol', 'Panadol', 'Calpol'],
        category: 'Analgesic/Antipyretic',
        uses: ['Pain relief', 'Fever reduction'],
        commonDosage: '500-1000mg every 4-6 hours',
        maxDose: '4000mg per day',
        sideEffects: ['Nausea', 'Liver damage with overdose'],
        warnings: ['Do not exceed recommended dose', 'Avoid with alcohol', 'Caution with liver disease'],
        interactions: ['Warfarin']
    },
    ibuprofen: {
        genericName: 'Ibuprofen',
        brandNames: ['Advil', 'Motrin', 'Nurofen'],
        category: 'NSAID',
        uses: ['Pain relief', 'Inflammation', 'Fever', 'Arthritis'],
        commonDosage: '200-400mg every 4-6 hours',
        maxDose: '1200mg per day (OTC), 3200mg (prescription)',
        sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness'],
        warnings: ['Take with food', 'Avoid with ulcers', 'Caution with kidney disease'],
        interactions: ['Aspirin', 'Blood thinners', 'ACE inhibitors']
    },
    aspirin: {
        genericName: 'Acetylsalicylic Acid',
        brandNames: ['Bayer', 'Bufferin', 'Ecotrin'],
        category: 'NSAID/Antiplatelet',
        uses: ['Pain relief', 'Fever', 'Heart attack prevention', 'Stroke prevention'],
        commonDosage: '81-325mg daily for heart, 325-650mg for pain',
        maxDose: '4000mg per day',
        sideEffects: ['Stomach bleeding', 'Ulcers', 'Tinnitus'],
        warnings: ['Not for children under 12', 'Avoid with bleeding disorders', 'Take with food'],
        interactions: ['Blood thinners', 'NSAIDs', 'Corticosteroids']
    },
    amoxicillin: {
        genericName: 'Amoxicillin',
        brandNames: ['Amoxil', 'Trimox', 'Moxatag'],
        category: 'Antibiotic',
        uses: ['Bacterial infections', 'Ear infections', 'Respiratory infections'],
        commonDosage: '250-500mg every 8 hours',
        maxDose: '3000mg per day',
        sideEffects: ['Diarrhea', 'Nausea', 'Rash', 'Allergic reactions'],
        warnings: ['Complete full course', 'Check for penicillin allergy', 'May reduce birth control effectiveness'],
        interactions: ['Methotrexate', 'Allopurinol']
    },
    'metformin': {
        genericName: 'Metformin',
        brandNames: ['Glucophage', 'Glumetza', 'Fortamet'],
        category: 'Antidiabetic',
        uses: ['Type 2 diabetes', 'Blood sugar control'],
        commonDosage: '500mg twice daily',
        maxDose: '2550mg per day',
        sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Vitamin B12 deficiency'],
        warnings: ['Monitor kidney function', 'Avoid with excessive alcohol', 'Stop before contrast imaging'],
        interactions: ['Cimetidine', 'Furosemide', 'Nifedipine']
    },
    lisinopril: {
        genericName: 'Lisinopril',
        brandNames: ['Prinivil', 'Zestril'],
        category: 'ACE Inhibitor',
        uses: ['Hypertension', 'Heart failure', 'Heart attack recovery'],
        commonDosage: '10-40mg once daily',
        maxDose: '40mg per day',
        sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Hyperkalemia'],
        warnings: ['Do not use in pregnancy', 'Monitor potassium levels', 'Check kidney function'],
        interactions: ['Potassium supplements', 'NSAIDs', 'Diuretics']
    },
    omeprazole: {
        genericName: 'Omeprazole',
        brandNames: ['Prilosec', 'Zegerid', 'Losec'],
        category: 'Proton Pump Inhibitor',
        uses: ['GERD', 'Stomach ulcers', 'Heartburn', 'H. pylori infection'],
        commonDosage: '20-40mg once daily',
        maxDose: '40mg per day',
        sideEffects: ['Headache', 'Nausea', 'Diarrhea', 'Vitamin B12 deficiency'],
        warnings: ['Short-term use preferred', 'May increase fracture risk', 'Long-term use risks'],
        interactions: ['Clopidogrel', 'Methotrexate', 'Ketoconazole']
    },
    cetirizine: {
        genericName: 'Cetirizine',
        brandNames: ['Zyrtec', 'Reactine'],
        category: 'Antihistamine',
        uses: ['Allergies', 'Hay fever', 'Hives', 'Itching'],
        commonDosage: '5-10mg once daily',
        maxDose: '10mg per day',
        sideEffects: ['Drowsiness', 'Dry mouth', 'Fatigue'],
        warnings: ['May cause drowsiness', 'Avoid alcohol', 'Caution with liver/kidney issues'],
        interactions: ['Other antihistamines', 'Alcohol', 'Sedatives']
    },
    loratadine: {
        genericName: 'Loratadine',
        brandNames: ['Claritin', 'Alavert'],
        category: 'Antihistamine',
        uses: ['Allergies', 'Hay fever', 'Skin reactions'],
        commonDosage: '10mg once daily',
        maxDose: '10mg per day',
        sideEffects: ['Headache', 'Dry mouth', 'Fatigue'],
        warnings: ['Less drowsy than cetirizine', 'Take at same time daily', 'Check liver function'],
        interactions: ['Erythromycin', 'Ketoconazole', 'Cimetidine']
    },
    prednisone: {
        genericName: 'Prednisone',
        brandNames: ['Deltasone', 'Prednisone Intensol'],
        category: 'Corticosteroid',
        uses: ['Inflammation', 'Allergies', 'Autoimmune conditions', 'Asthma'],
        commonDosage: '5-60mg daily (varies by condition)',
        maxDose: 'Varies by condition',
        sideEffects: ['Weight gain', 'Mood changes', 'Increased appetite', 'High blood sugar'],
        warnings: ['Do not stop abruptly', 'Take with food', 'May weaken immune system'],
        interactions: ['NSAIDs', 'Diuretics', 'Blood thinners', 'Diabetes medications']
    },
    atorvastatin: {
        genericName: 'Atorvastatin',
        brandNames: ['Lipitor'],
        category: 'Statin',
        uses: ['High cholesterol', 'Heart disease prevention'],
        commonDosage: '10-80mg once daily',
        maxDose: '80mg per day',
        sideEffects: ['Muscle pain', 'Liver problems', 'Digestive issues'],
        warnings: ['Avoid grapefruit', 'Report muscle pain', 'Monitor liver function'],
        interactions: ['Gemfibrozil', 'Cyclosporine', 'Erythromycin', 'Grapefruit juice']
    }
};
function getMedicationInfo(medication) {
    const lowerMed = medication.toLowerCase();
    return medicationData[lowerMed] || null;
}
function searchMedications(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    Object.entries(medicationData).forEach(([name, data]) => {
        if (name.includes(lowerQuery) ||
            data.genericName.toLowerCase().includes(lowerQuery) ||
            data.brandNames.some(b => b.toLowerCase().includes(lowerQuery)) ||
            data.category.toLowerCase().includes(lowerQuery)) {
            results.push({ name, ...data });
        }
    });
    return results;
}
function getAllMedications() {
    return Object.keys(medicationData);
}
function getMedicationsByCategory(category) {
    return Object.entries(medicationData)
        .filter(([, data]) => data.category.toLowerCase().includes(category.toLowerCase()))
        .map(([name, data]) => ({ name, ...data }));
}
function checkInteractions(medication1, medication2) {
    const med1 = getMedicationInfo(medication1);
    const med2 = getMedicationInfo(medication2);
    if (!med1 || !med2) {
        return { hasInteraction: false, details: null };
    }
    const interactions = [];
    med1.interactions?.forEach(interaction => {
        if (med2.genericName.toLowerCase().includes(interaction.toLowerCase()) ||
            med2.brandNames.some(b => b.toLowerCase().includes(interaction.toLowerCase()))) {
            interactions.push(`${med1.genericName} may interact with ${med2.genericName}`);
        }
    });
    med2.interactions?.forEach(interaction => {
        if (med1.genericName.toLowerCase().includes(interaction.toLowerCase()) ||
            med1.brandNames.some(b => b.toLowerCase().includes(interaction.toLowerCase()))) {
            interactions.push(`${med2.genericName} may interact with ${med1.genericName}`);
        }
    });
    return {
        hasInteraction: interactions.length > 0,
        details: interactions.length > 0 ? interactions : null
    };
}
module.exports = {
    getMedicationInfo,
    searchMedications,
    getAllMedications,
    getMedicationsByCategory,
    checkInteractions
};
//# sourceMappingURL=medicationDatabase.js.map