"use client"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onPageChange: (page: number) => void;
};

const PaginationSection = ({ page, totalPages, total, limit, hasNext, hasPrevious, onPageChange }: Props) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const showing = Math.min(limit, total - (page - 1) * limit);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <p className="text-sm">Showing {showing} from {total} data</p>
            </div>
            <div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (hasPrevious) onPageChange(page - 1); }}
                                className={!hasPrevious ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>

                        <div className="border border-[#E3E4EB] flex rounded-full">
                            {pages.map((p) => (
                                <PaginationItem key={p}>
                                    <PaginationLink
                                        href="#"
                                        isActive={p === page}
                                        onClick={(e) => { e.preventDefault(); onPageChange(p); }}
                                    >
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                        </div>

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (hasNext) onPageChange(page + 1); }}
                                className={!hasNext ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};

export default PaginationSection;