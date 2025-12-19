"use client";

import { IncomingInspectionChecklistRow } from '@/lib/api/types/incomingInspection';
import { COMPONENT_LABELS } from './constants';

type IncomingInspectionPreviewProps = {
  componentType: keyof typeof COMPONENT_LABELS;
  details?: {
    material_name?: string;
    batch_lot_no?: string;
    inward_date?: string;
    inward_quantity?: number;
    mpn_no?: string;
  };
  sampling?: {
    total_sample_tested?: number;
    sample_number?: string;
  };
  checklist?: IncomingInspectionChecklistRow[];
  releaseDecision?: {
    overall_result?: 'PASS' | 'FAIL';
    released?: boolean;
  };
  testedBy?: { name?: string; signed_at?: string };
  approvedBy?: { name?: string; signed_at?: string };
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export function IncomingInspectionPreview({
  componentType,
  details,
  sampling,
  checklist = [],
  releaseDecision,
  testedBy,
  approvedBy,
}: IncomingInspectionPreviewProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 text-xs">
      <div className="text-center font-semibold uppercase tracking-wider text-rose-600">Master Copy</div>
      <div className="mt-3 grid grid-cols-3 border text-[11px]">
        <div className="border-r p-2 font-semibold">Oom</div>
        <div className="border-r p-2 text-center font-semibold">Kali Medtech Pvt Ltd.</div>
        <div className="p-2">
          <div>
            <span className="font-semibold">Document number</span> FOR/QCD/002/17
          </div>
          <div>
            <span className="font-semibold">Revision No.</span> 01
          </div>
          <div>
            <span className="font-semibold">Effective date</span> 13/05/2025
          </div>
        </div>
        <div className="col-span-3 border-t p-2 text-center font-semibold">
          Incoming inspection of Electronic component for PCB Assembly
        </div>
      </div>

      <div className="mt-4 font-semibold">1. Details for {COMPONENT_LABELS[componentType]}:</div>
      <div className="grid grid-cols-2 border text-[11px]">
        <div className="border-r p-2 font-semibold">Material Name:</div>
        <div className="p-2">{details?.material_name ?? ''}</div>
        <div className="border-t border-r p-2 font-semibold">Batch no./Lot no.:</div>
        <div className="border-t p-2">{details?.batch_lot_no ?? ''}</div>
        <div className="border-t border-r p-2 font-semibold">Inward Date:</div>
        <div className="border-t p-2">{formatDate(details?.inward_date)}</div>
        <div className="border-t border-r p-2 font-semibold">Inward Quantity:</div>
        <div className="border-t p-2">{details?.inward_quantity ?? ''}</div>
        <div className="border-t border-r p-2 font-semibold">MPN no. (If applicable):</div>
        <div className="border-t p-2">{details?.mpn_no ?? ''}</div>
      </div>

      <div className="mt-4 font-semibold">1.1 Sampling Quantity:</div>
      <div className="grid grid-cols-2 border text-[11px]">
        <div className="border-r p-2 font-semibold">Total Sample Tested</div>
        <div className="p-2">{sampling?.total_sample_tested ?? ''}</div>
        <div className="border-t border-r p-2 font-semibold">Sample Number</div>
        <div className="border-t p-2">{sampling?.sample_number ?? ''}</div>
      </div>

      <div className="mt-4 font-semibold">1.2 Inspection Checklist:</div>
      <table className="w-full border text-[11px]">
        <thead className="bg-neutral-100">
          <tr>
            <th className="border px-2 py-1">Sr no.</th>
            <th className="border px-2 py-1">Test name</th>
            <th className="border px-2 py-1">Specification</th>
            <th className="border px-2 py-1">Observation</th>
            <th className="border px-2 py-1">Result</th>
          </tr>
        </thead>
        <tbody>
          {checklist.map((row) => (
            <tr key={`${row.sr_no}-${row.test_name}`}>
              <td className="border px-2 py-1 text-center">{row.sr_no}</td>
              <td className="border px-2 py-1">{row.test_name}</td>
              <td className="border px-2 py-1">{row.specification}</td>
              <td className="border px-2 py-1">{row.observation ?? ''}</td>
              <td className="border px-2 py-1 text-center">{row.result ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 text-[11px]">
        Based on the above results, the tested materials have
        {releaseDecision?.overall_result === 'PASS'
          ? ' passed'
          : releaseDecision?.overall_result === 'FAIL'
            ? ' failed'
            : ' passed/failed'}{' '}
        all tests and are{' '}
        {releaseDecision?.released === true
          ? 'released'
          : releaseDecision?.released === false
            ? 'not released'
            : 'released/not released'}{' '}
        for further use.
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border text-[11px]">
        <div className="border-r p-2">
          <div className="font-semibold">Tested By (QC) Sign & Date</div>
          <div>{testedBy?.name ?? ''}</div>
          <div>{formatDate(testedBy?.signed_at)}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">Approved By (QA) Sign & Date</div>
          <div>{approvedBy?.name ?? ''}</div>
          <div>{formatDate(approvedBy?.signed_at)}</div>
        </div>
      </div>

      <div className="mt-4 text-[11px] font-semibold uppercase text-indigo-700">Control Copy</div>
    </div>
  );
}
