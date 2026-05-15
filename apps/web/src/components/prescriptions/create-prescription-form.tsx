'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  prescriptionsService,
  type CreatePrescriptionPayload,
} from '@/services/prescriptions.service';
import { patientsService } from '@/services/patients.service';
import { ApiError } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { Patient } from '@/types';

interface ItemRow {
  medicationName: string;
  dosage: string;
  frequency: string;
  quantity: string;
  instructions: string;
}

const EMPTY_ITEM: ItemRow = {
  medicationName: '',
  dosage: '',
  frequency: '',
  quantity: '',
  instructions: '',
};

export function CreatePrescriptionForm() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsService
      .list(1, 100)
      .then((res) => {
        setPatients(res.data);
        if (res.data.length > 0) setPatientId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const validItems = items.filter((it) => it.medicationName.trim());
    if (validItems.length === 0) {
      setError('Debes agregar al menos un medicamento');
      return;
    }

    const payload: CreatePrescriptionPayload = {
      patientId,
      notes: notes.trim() || undefined,
      items: validItems.map((it) => ({
        medicationName: it.medicationName.trim(),
        dosage: it.dosage.trim() || undefined,
        frequency: it.frequency.trim() || undefined,
        quantity: it.quantity ? Number(it.quantity) : undefined,
        instructions: it.instructions.trim() || undefined,
      })),
    };

    setLoading(true);
    try {
      const created = await prescriptionsService.create(payload);
      router.push(`/dashboard/prescriptions/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error al crear la receta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-2xl">
      {/* Paciente */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Paciente</h3>
        <Select
          label="Seleccionar paciente"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} — {p.user.email}
            </option>
          ))}
        </Select>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notas clínicas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Diagnóstico, observaciones..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Medicamentos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Medicamentos</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            + Agregar
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Medicamento {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              )}
            </div>
            <Input
              placeholder="Nombre del medicamento *"
              value={item.medicationName}
              onChange={(e) => updateItem(index, 'medicationName', e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Dosis (ej: 500mg)"
                value={item.dosage}
                onChange={(e) => updateItem(index, 'dosage', e.target.value)}
              />
              <Input
                placeholder="Frecuencia (ej: Cada 8h)"
                value={item.frequency}
                onChange={(e) => updateItem(index, 'frequency', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              />
              <Input
                placeholder="Instrucciones"
                value={item.instructions}
                onChange={(e) => updateItem(index, 'instructions', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Crear receta
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
