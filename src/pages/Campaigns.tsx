import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Upload, FileText, Download, Check, AlertCircle, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useNavigate } from 'react-router-dom';

const Campaigns = () => {
    const navigate = useNavigate();
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(30);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchInfluencers = async (currentPage: number, search: string = '') => {
        setIsLoading(true);
        try {
            const url = new URL(`http://127.0.0.1:8000/api/v1/influencers`);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('page_size', pageSize.toString());
            if (search) {
                url.searchParams.append('search', search);
            }

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                setInfluencers(data.influencers);
                setTotalCount(data.total);
                setTotalPages(data.total_pages);
            } else {
                console.error("Failed to fetch influencers");
            }
        } catch (error) {
            console.error("Error fetching influencers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchInfluencers(page, searchQuery);
    }, [page]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchInfluencers(1, searchQuery);
            } else {
                setPage(1); // Changing page will trigger the other effect
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

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
                fetchInfluencers(1);
                setPage(1);
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

                        {/* Temporary Navigation Code as per user request */}
                        <button
                            onClick={() => navigate('/campaigns/new/success')}
                            className="text-slate-500 hover:text-indigo-400 text-sm font-medium underline underline-offset-4"
                        >
                            View Success Screen
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Profile, Name, Location, Email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition whitespace-nowrap overflow-hidden text-ellipsis"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="w-full max-w-6xl border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-950/50">
                                <TableRow className="border-slate-800 hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="text-slate-400 min-w-[150px]">Profile Link</TableHead>
                                    <TableHead className="text-slate-400 min-w-[150px]">Name</TableHead>
                                    <TableHead className="text-slate-400">Gender</TableHead>
                                    <TableHead className="text-slate-400 min-w-[120px]">Location</TableHead>
                                    {/* <TableHead className="text-slate-400">Type</TableHead>
                                    <TableHead className="text-slate-400 min-w-[120px]">Niche</TableHead>
                                    <TableHead className="text-slate-400">Followers</TableHead>
                                    <TableHead className="text-slate-400">Avg Views</TableHead>
                                    <TableHead className="text-slate-400">Engagement</TableHead>
                                    <TableHead className="text-slate-400">Commercials</TableHead>
                                    <TableHead className="text-slate-400">M/F Split</TableHead>
                                    <TableHead className="text-slate-400">India Split</TableHead>
                                    <TableHead className="text-slate-400">Age Conc.</TableHead>
                                    <TableHead className="text-slate-400">Brand Fit</TableHead>
                                    <TableHead className="text-slate-400">Vibe</TableHead> */}
                                    <TableHead className="text-slate-400 min-w-[150px]">Contact No.</TableHead>
                                    <TableHead className="text-slate-400 min-w-[180px]">Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
                                                Loading data...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : influencers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            No influencers found. Upload a CSV to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    influencers.map((influencer, index) => (
                                        <TableRow key={influencer.id || index} className="border-slate-800 hover:bg-slate-800/50 whitespace-nowrap">
                                            <TableCell className="text-slate-400">
                                                {influencer.profile?.link ? (
                                                    <a href={influencer.profile.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                        Visit Profile
                                                    </a>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-200">{influencer.profile?.name || '-'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.profile?.gender || '-'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.profile?.location || '-'}</TableCell>
                                            {/* <TableCell className="text-slate-400">{influencer.profile?.type || '-'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.brand?.niche || '-'}</TableCell>
                                            <TableCell className="text-slate-300 font-mono text-xs">{influencer.metrics?.followers?.toLocaleString() || '0'}</TableCell>
                                            <TableCell className="text-slate-300 font-mono text-xs">{influencer.metrics?.avg_views?.toLocaleString() || '0'}</TableCell>
                                            <TableCell className="text-slate-300 font-mono text-xs">{influencer.metrics?.engagement_rate ? `${influencer.metrics.engagement_rate}%` : '0%'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.commercials || '-'}</TableCell>
                                            <TableCell className="text-slate-400 text-xs">{influencer.audience?.mf_split || '-'}</TableCell>
                                            <TableCell className="text-slate-400 text-xs">{influencer.audience?.india_split || '-'}</TableCell>
                                            <TableCell className="text-slate-400 text-xs">{influencer.audience?.age_concentration || '-'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.brand?.brand_fit || '-'}</TableCell>
                                            <TableCell className="text-slate-400">{influencer.brand?.vibe || '-'}</TableCell> */}
                                            <TableCell className="text-slate-300">{influencer.contact?.contact_no || '-'}</TableCell>
                                            <TableCell className="text-slate-300">{influencer.contact?.email || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="w-full max-w-4xl flex items-center justify-between mt-6 px-4">
                        <div className="text-sm text-slate-500">
                            Showing <span className="text-slate-300">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-300">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-slate-300">{totalCount}</span> records
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 text-sm rounded-lg transition ${page === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default Campaigns;
