import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Upload, FileText, Download, Check, AlertCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Campaigns = () => {

    const influencers = [
        { name: 'Aditi Kapoor', handle: '@aditix', phone: 'NoWhatsapp', email: 'No Email', category: 'Beauty', city: 'Mumbai', phoneStatus: 'warning', emailStatus: 'warning' },
        { name: 'Rahul Verma', handle: '@rahulv', phone: '+91 9823 456789', email: 'rahul@gmail.com', category: 'Fitness', city: 'Delhi', phoneStatus: 'success', emailStatus: 'success' }, // Email hidden in image but assuming success for variety or matching typical data
        { name: 'Simran Sharma', handle: '@simran.s', phone: 'simran@gmail.com', email: '', category: 'Lifestyle', city: 'Mumbai', phoneStatus: 'warning', emailStatus: 'success' }, // Image shows email in phone column? Let's follow image text.

    ];

    const tableData = [
        { name: 'Aditi Kapoor', handle: '@aditix', phone: 'NoWhatsapp', phoneColor: 'text-orange-500', email: 'No Email', emailColor: 'text-orange-500', category: 'Beauty', city: 'Mumbai' },
        { name: 'Rahul Verma', handle: '@rahulv', phone: '+91 9823 456789', phoneColor: 'text-slate-300', email: '-', emailColor: 'text-slate-500', category: 'Fitness', city: 'Delhi' },
        { name: 'Simran Sharma', handle: '@simran.s', phone: 'simran@gmail.com', phoneColor: 'text-orange-500', email: '-', emailColor: 'text-slate-500', category: 'Lifestyle', city: 'Mumbai' },
        { name: 'Ankit Yadav', handle: '@ankity_', phone: 'No Email', phoneColor: 'text-orange-500', email: 'No Email', emailColor: 'text-orange-500', category: 'Travel', city: 'Bangalore' },
        { name: 'Priya Singh', handle: '@priyarg', phone: '+91 9810 123456', phoneColor: 'text-slate-300', email: '-', emailColor: 'text-slate-500', category: 'Delhi', city: 'Delhi' },
    ];

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            await uploadFile(file);
        } else {
            // You might want to import toast from 'sonner' if available, or just alert for now
            alert("Please upload a valid CSV file.");
        }
    };

    const handleDownloadSample = () => {
        const headers = [
            'PROFILE LINK', 'NAME', 'GENDER', 'LOCATION', 'TYPE', 'NICHE',
            'FOLLOWERS', 'AVERAGE VIEWS', 'ENGAGEMENT RATE', 'COMMERCIALS',
            'M/F SPLIT', 'INDIA 1/2 SPLIT', 'AGE CONCENTRATION', 'BRAND FIT',
            'VIBE', 'CONTACT NO.', 'EMAIL'
        ];
        const csvContent = headers.join('\t'); // User mentioned tabs in the prompt "PROFILE LINK NAME..." look like tab separated or space but typical "CSV" usually uses commas, however the user input had large spaces. I will use comma as standard for CSV, but join with comma.
        // Re-reading user request: "PROFILE LINK\tNAME\tGENDER..." - actually it looks like they pasted from a spreadsheet. CSV usually uses commas. 
        // I will use commas for a standard CSV.
        const csvString = headers.join(',');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_influencers.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/upload-csv', {
                method: 'POST',
                body: formData,
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { detail: "Invalid response from server" };
            }

            if (response.ok) {
                alert(`Success: ${data.uploaded_records} records uploaded!`);
            } else {
                console.error("Server error:", data);
                alert(`Error: ${data.detail || 'Upload failed'}`);
            }
        } catch (error: any) {
            console.error("Upload error details:", error);
            alert(`Failed to connect to the server: ${error.message || 'Unknown network error'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center p-8 min-h-full">

                {/* Upload Card */}
                <div className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-semibold text-white text-center mb-8">Upload Influencer List</h2>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".csv"
                        className="hidden"
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center mb-6 bg-slate-950/30 hover:bg-slate-900/50 transition cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                            {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div> : <FileText size={24} />}
                        </div>
                        <p className="text-slate-300 mb-1">
                            {isUploading ? "Uploading..." : <>{'Drag & drop CSV or '}<span className="text-slate-400 underline">browse files</span></>}
                        </p>
                    </div>

                    <div className="flex items-start justify-between gap-8">
                        <div className="text-sm text-slate-400">
                            <div className="flex items-center gap-2 mb-2 text-slate-300">
                                <Check size={16} className="text-green-500" />
                                <span>Supported columns:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 ml-1">
                                <li>PROFILE LINK</li>
                                <li>NAME</li>
                                <li>GENDER</li>
                                <li>LOCATION</li>
                                <li>CONTACT NO.</li>
                                <li>EMAIL</li>
                                <li className="text-slate-500 italic">...and more</li>
                            </ul>
                            <button
                                onClick={handleDownloadSample}
                                className="flex items-center gap-2 text-slate-400 hover:text-white mt-4 text-xs transition"
                            >
                                <Download size={14} />
                                Download sample CSV
                            </button>
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Uploading...' : 'Upload CSV'}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full max-w-4xl border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-slate-950/50">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-400">Influencer Name</TableHead>
                                <TableHead className="text-slate-400">Instagram Handle</TableHead>
                                <TableHead className="text-slate-400">Phone</TableHead>
                                <TableHead className="text-slate-400">Email</TableHead>
                                <TableHead className="text-slate-400">Category</TableHead>
                                <TableHead className="text-slate-400">City</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.map((influencer, index) => (
                                <TableRow key={index} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-200">{influencer.name}</TableCell>
                                    <TableCell className="text-slate-400">{influencer.handle}</TableCell>
                                    <TableCell className={influencer.phoneColor}>
                                        <div className="flex items-center gap-2">
                                            {(influencer.phone === 'NoWhatsapp' || influencer.phone === 'No Email' || influencer.phone.includes('@')) && (
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            )}
                                            {influencer.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell className={influencer.emailColor}>
                                        <div className="flex items-center gap-2">
                                            {influencer.email === 'No Email' && (
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            )}
                                            {influencer.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400">{influencer.category}</TableCell>
                                    <TableCell className="text-slate-400">{influencer.city}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Campaigns;
