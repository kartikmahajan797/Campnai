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
        // Image row 3: Phone: simran@gmail.com (seems like email in phone col?), Email: (empty/hidden). 
        // Actually looking closely at image:
        // Row 1: Phone "NoWhatsapp" (orange), Email "No Email" (orange)
        // Row 2: Phone "+91...", Email (empty/hidden)
        // Row 3: Phone "simran@gmail.com" (orange icon? maybe email icon?), Email (empty). Wait, 3rd row Phone col has email address. User might want exact copy.
        // Let's stick to the structure: Name, Handle, Phone, Email, Category, City.
        // Row 3 in image: "Simran Sharma", "@simran.s", "simran@gmail.com" (with orange dot), "Lifestyle", "Mumbai".
        // It seems the columns in image are: Influencer Name, Instagram Handle, Phone, Email, Category, City.
        // But for Simran, "simran@gmail.com" is under Phone? That seems like a data error in the design or I'm misreading.
        // Ah, wait. The image has columns: Influencer Name, Instagram Handle, Phone, Email, Category, City.
        // For Simran: Phone column contains "simran@gmail.com". That's weird.
        // Let's just follow the text "simran@gmail.com" for that cell, regardless of column header, to match visual.
        // Actually, looking at the crop, strictly:
        // Row 1: Aditi... | @aditix | (orange) NoWhatsapp | (orange) No Email | Beauty | Mumbai
        // Row 2: Rahul... | @rahulv | +91 9823 456789 | | Fitness | Delhi
        // Row 3: Simran... | @simran.s | (orange) simran@gmail.com | | Lifestyle | Mumbai
        // Row 4: Ankit... | @ankity_ | (orange) No Email | (orange) No Email | Travel | Bangalore
        // Row 5: Priya... | @priyarg | +91 9810 123456 | | Delhi | Delhi

        // I will try to make it look reasonable.
    ];

    const tableData = [
        { name: 'Aditi Kapoor', handle: '@aditix', phone: 'NoWhatsapp', phoneColor: 'text-orange-500', email: 'No Email', emailColor: 'text-orange-500', category: 'Beauty', city: 'Mumbai' },
        { name: 'Rahul Verma', handle: '@rahulv', phone: '+91 9823 456789', phoneColor: 'text-slate-300', email: '-', emailColor: 'text-slate-500', category: 'Fitness', city: 'Delhi' },
        { name: 'Simran Sharma', handle: '@simran.s', phone: 'simran@gmail.com', phoneColor: 'text-orange-500', email: '-', emailColor: 'text-slate-500', category: 'Lifestyle', city: 'Mumbai' },
        { name: 'Ankit Yadav', handle: '@ankity_', phone: 'No Email', phoneColor: 'text-orange-500', email: 'No Email', emailColor: 'text-orange-500', category: 'Travel', city: 'Bangalore' },
        { name: 'Priya Singh', handle: '@priyarg', phone: '+91 9810 123456', phoneColor: 'text-slate-300', email: '-', emailColor: 'text-slate-500', category: 'Delhi', city: 'Delhi' },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center p-8 min-h-full">

                {/* Upload Card */}
                <div className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-semibold text-white text-center mb-8">Upload Influencer List</h2>

                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center mb-6 bg-slate-950/30 hover:bg-slate-900/50 transition cursor-pointer">
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                            <FileText size={24} />
                        </div>
                        <p className="text-slate-300 mb-1">Drag & drop CSV or <span className="text-slate-400 underline">browse files</span></p>
                    </div>

                    <div className="flex items-start justify-between gap-8">
                        <div className="text-sm text-slate-400">
                            <div className="flex items-center gap-2 mb-2 text-slate-300">
                                <Check size={16} className="text-green-500" />
                                <span>Supported columns:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 ml-1">
                                <li>Influencer Name</li>
                                <li>Instagram Handle</li>
                                <li>Phone (optional)</li>
                                <li>Email (optional)</li>
                                <li>City</li>
                            </ul>
                            <button className="flex items-center gap-2 text-slate-400 hover:text-white mt-4 text-xs transition">
                                <Download size={14} />
                                Download sample CSV
                            </button>
                        </div>

                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20">
                            Upload CSV
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
