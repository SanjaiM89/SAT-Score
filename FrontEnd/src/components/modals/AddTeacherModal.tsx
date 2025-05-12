import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teacherData: any) => void;
  editingTeacher?: any;
}

interface Department {
  id: string;
  shortName: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose, onSubmit, editingTeacher }) => {
  const initialFormData = {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    designation: '',
    department: '',
    subjectsHandled: [] as { subject_id: string; batch: string; section: string }[],
    yearsOfExperience: '',
    qualification: '',
    researchArea: '',
    joiningDate: '',
    officeRoomNumber: '',
    alternateContact: '',
    remarks: '',
    teacherId: '',
    password: '', // No default password; backend will handle
  };

  const [formData, setFormData] = useState(initialFormData);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTeacherId, setGeneratedTeacherId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');

        // Fetch departments
        const deptResponse = await fetch(`${apiUrl}/api/departments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!deptResponse.ok) {
          const errorText = await deptResponse.text();
          throw new Error(`Failed to fetch departments: ${deptResponse.status} ${errorText}`);
        }
        const deptData = await deptResponse.json();
        setDepartments(deptData);

        // Fetch subjects
        const subjResponse = await fetch(`${apiUrl}/api/subjects`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!subjResponse.ok) {
          const errorText = await subjResponse.text();
          throw new Error(`Failed to fetch subjects: ${subjResponse.status} ${errorText}`);
        }
        const subjData = await subjResponse.json();
        setSubjects(subjData);
      } catch (err: any) {
        setError(`Error fetching data: ${err.message}`);
        toast.error(`Failed to load departments or subjects: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      fetchData();
      setGeneratedTeacherId('');
      setFormData(initialFormData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        fullName: editingTeacher.fullName || '',
        dateOfBirth: editingTeacher.dateOfBirth ? editingTeacher.dateOfBirth.split('T')[0] : '',
        gender: editingTeacher.gender || '',
        phoneNumber: editingTeacher.phoneNumber || '',
        email: editingTeacher.email || '',
        address: editingTeacher.address || '',
        city: editingTeacher.city || '',
        state: editingTeacher.state || '',
        postalCode: editingTeacher.postalCode || '',
        designation: editingTeacher.designation || '',
        department: editingTeacher.department?._id || editingTeacher.department || '',
        subjectsHandled: editingTeacher.subjectsHandled?.map((s: any) => ({
          subject_id: s.subject_id?._id || s.subject_id || s.code,
          batch: s.batch || '2025',
          section: s.section || 'A',
        })) || [],
        yearsOfExperience: editingTeacher.yearsOfExperience?.toString() || '',
        qualification: editingTeacher.qualification || '',
        researchArea: editingTeacher.researchArea || '',
        joiningDate: editingTeacher.joiningDate ? editingTeacher.joiningDate.split('T')[0] : '',
        officeRoomNumber: editingTeacher.officeRoomNumber || '',
        alternateContact: editingTeacher.alternateContact || '',
        remarks: editingTeacher.remarks || '',
        teacherId: editingTeacher.teacherId || '',
        password: '', // Do not prefill password
      });
      setGeneratedTeacherId(editingTeacher.teacherId || '');
    }
  }, [editingTeacher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.selectedOptions;
    const values = Array.from(options).map(option => ({
      subject_id: option.value,
      batch: formData.subjectsHandled.find(s => s.subject_id === option.value)?.batch || '2025',
      section: formData.subjectsHandled.find(s => s.subject_id === option.value)?.section || 'A',
    }));
    setFormData(prev => ({ ...prev, subjectsHandled: values }));
  };

  const handleSubjectDetailChange = (subject_id: string, field: 'batch' | 'section', value: string) => {
    setFormData(prev => ({
      ...prev,
      subjectsHandled: prev.subjectsHandled.map(s =>
        s.subject_id === subject_id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Prepare payload
      const payload = {
        ...formData,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        department: formData.department,
        subjectsHandled: formData.subjectsHandled.map(s => ({
          subject_id: s.subject_id,
          batch: s.batch,
          section: s.section,
        })),
      };
      if (!editingTeacher) {
        delete payload.teacherId; // Exclude teacherId for new teachers
      }
      if (!payload.password) {
        delete payload.password; // Let backend set default hashed password
      }
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      // Call onSubmit (passed as handleAddTeacher from Teachers.tsx)
      const data = await onSubmit(payload);
      
      if (!editingTeacher) {
        setGeneratedTeacherId(data.teacherId);
      }
      toast.success(`Teacher ${editingTeacher ? 'updated' : 'added'} successfully! Teacher ID: ${data.teacherId}`);
      
      // Reset form
      setFormData(initialFormData);
      setGeneratedTeacherId('');
      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.message || 'Failed to add teacher';
      toast.error(`Failed to ${editingTeacher ? 'update' : 'add'} teacher: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && <div className="text-red-500 text-center">{error}</div>}
          {loading && <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(generatedTeacherId || editingTeacher) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher ID</label>
                  <input
                    type="text"
                    name="teacherId"
                    value={editingTeacher ? formData.teacherId : generatedTeacherId}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (optional)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank for default"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Designation</option>
                  <option value="professor">Professor</option>
                  <option value="assistant_professor">Assistant Professor</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects Handled</label>
                <select
                  multiple
                  name="subjectsHandled"
                  value={formData.subjectsHandled.map(s => s.subject_id)}
                  onChange={handleSubjectsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white h-32"
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple subjects</p>
                {formData.subjectsHandled.map(subject => (
                  <div key={subject.subject_id} className="mt-2 flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch</label>
                      <select
                        value={subject.batch}
                        onChange={(e) => handleSubjectDetailChange(subject.subject_id, 'batch', e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="2025">2025 Batch</option>
                        <option value="2024">2024 Batch</option>
                        <option value="2023">2023 Batch</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                      <select
                        value={subject.section}
                        onChange={(e) => handleSubjectDetailChange(subject.subject_id, 'section', e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qualification</label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Qualification</option>
                  <option value="phd">Ph.D</option>
                  <option value="me">M.E</option>
                  <option value="mtech">M.Tech</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Research Area</label>
                <input
                  type="text"
                  name="researchArea"
                  value={formData.researchArea}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Office Room Number</label>
                <input
                  type="text"
                  name="officeRoomNumber"
                  value={formData.officeRoomNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternate Contact</label>
                <input
                  type="tel"
                  name="alternateContact"
                  value={formData.alternateContact}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks/Notes</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {loading ? 'Submitting...' : editingTeacher ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};