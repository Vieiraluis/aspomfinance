import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

interface GenerateReceiptResult {
  receiptNumber: string;
  sequenceNumber: number;
  yearMonth: string;
}

export function useReceiptNumber() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReceiptNumber = async (): Promise<GenerateReceiptResult | null> => {
    if (!user) return null;
    
    setIsGenerating(true);
    
    try {
      const now = new Date();
      const yearMonth = format(now, 'yyyyMM'); // e.g., "202602"
      const month = format(now, 'MM');
      const year = format(now, 'yy');
      
      // Try to get existing counter for this month
      const { data: existing, error: fetchError } = await supabase
        .from('receipt_numbers')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .single();
      
      let newNumber: number;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // No record exists, create new one
        const { error: insertError } = await supabase
          .from('receipt_numbers')
          .insert({
            user_id: user.id,
            year_month: yearMonth,
            last_number: 1
          });
        
        if (insertError) throw insertError;
        newNumber = 1;
      } else if (fetchError) {
        throw fetchError;
      } else {
        // Update existing counter
        newNumber = (existing?.last_number || 0) + 1;
        
        const { error: updateError } = await supabase
          .from('receipt_numbers')
          .update({ last_number: newNumber })
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
      }
      
      // Format: NNMMYY (e.g., 0101126 = receipt 01, month 01, year 26)
      // But the example shows 1130126, which is receipt 113, month 01, year 26
      // So format is: NNN + MM + YY (variable length number + month + year)
      const receiptNumber = `${newNumber}${month}${year}`;
      
      return {
        receiptNumber,
        sequenceNumber: newNumber,
        yearMonth
      };
    } catch (error) {
      console.error('Error generating receipt number:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMultipleReceiptNumbers = async (count: number): Promise<GenerateReceiptResult[]> => {
    const results: GenerateReceiptResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const result = await generateReceiptNumber();
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  return {
    generateReceiptNumber,
    generateMultipleReceiptNumbers,
    isGenerating
  };
}
