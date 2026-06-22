import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { transactionRepository } from '../../database/repositories/transactionRepository';
import { formatCurrency } from '@utils/id';

// Lazy load file system to avoid import errors across SDK sub-versions
async function getFileSystem() {
  // Try new API first, fall back to legacy
  try {
    const fs = await import('expo-file-system/legacy');
    return fs;
  } catch {
    const fs = await import('expo-file-system');
    return fs as unknown as typeof import('expo-file-system/legacy');
  }
}

export const exportService = {
  async exportCSV(userId: string,
  startDate: string,
  endDate: string): Promise<void> {
    const FileSystem = await getFileSystem();

    const transactions = await transactionRepository.getAll({
      userId: '', // No user filter for export - include all transactions
      startDate,
      endDate,
      limit: 10000,
    });

    const header = 'Date,Type,Category,Amount,Note\n';
    const rows = transactions
      .map((t) => {
        const amount = (t.amount / 100).toFixed(2);
        const category = t.category?.name ?? 'Uncategorized';
        const note = t.note.replace(/,/g, ';');
        return `${t.date},${t.type},${category},${amount},${note}`;
      })
      .join('\n');

    const csv = header + rows;
    const filename = `vault-export-${startDate}-to-${endDate}.csv`;

    if (!FileSystem.documentDirectory) {
      throw new Error('File system unavailable');
    }

    const path = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error('Sharing is not available on this device');

    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Transactions',
      UTI: 'public.comma-separated-values-text',
    });
  },

  async exportPDF(userId: string,
  startDate: string,
  endDate: string): Promise<void> {
    const FileSystem = await getFileSystem();

    const transactions = await transactionRepository.getAll({
      userId: '', // No user filter for export - include all transactions
      startDate,
      endDate,
      limit: 10000,
    });

    const summary = await transactionRepository.getSummary(userId,startDate, endDate);
    const totalIncome = formatCurrency(summary.totalIncome);
    const totalExpenses = formatCurrency(summary.totalExpenses);
    const balance = formatCurrency(summary.balance);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            color: #111;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { border-bottom: 2px solid #22c55e; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 28px; font-weight: 700; margin: 0; }
          .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
          .summary { display: flex; gap: 24px; margin-bottom: 32px; }
          .summary-card {
            flex: 1; background: #f8f8f8;
            border-radius: 8px; padding: 16px;
          }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-value { font-size: 22px; font-weight: 700; margin-top: 4px; }
          .income { color: #22c55e; }
          .expense { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 12px; background: #111; color: #fff; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #fafafa; }
          .amount-cell { text-align: right; font-weight: 600; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Vault — Financial Report</h1>
          <p class="subtitle">${startDate} to ${endDate}</p>
        </div>
        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Total income</div>
            <div class="summary-value income">${totalIncome}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total expenses</div>
            <div class="summary-value expense">${totalExpenses}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Net balance</div>
            <div class="summary-value">${balance}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Note</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map((t) => {
                const amount = formatCurrency(t.amount);
                const isExpense = t.type === 'expense';
                return `
                  <tr>
                    <td>${t.date}</td>
                    <td>${t.category?.name ?? 'Uncategorized'}</td>
                    <td>${t.note || '—'}</td>
                    <td class="amount-cell ${isExpense ? 'expense' : 'income'}">
                      ${isExpense ? '-' : '+'}${amount}
                    </td>
                  </tr>`;
              })
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated by Vault on ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (!FileSystem.documentDirectory) {
      throw new Error('File system unavailable');
    }

    const filename = `vault-report-${startDate}-to-${endDate}.pdf`;
    const dest = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.moveAsync({ from: uri, to: dest });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error('Sharing not available');

    await Sharing.shareAsync(dest, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Report',
      UTI: 'com.adobe.pdf',
    });
  },
};