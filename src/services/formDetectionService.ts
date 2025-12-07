import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FormField {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  required: boolean;
}

export interface DetectedForm {
  url: string;
  action?: string;
  method?: string;
  fields: FormField[];
}

export const detectFormsFromUrl = async (url: string): Promise<DetectedForm[]> => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadTracker/1.0)',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const forms: DetectedForm[] = [];

    $('form').each((index, element) => {
      const form = $(element);
      const action = form.attr('action') || '';
      const method = form.attr('method') || 'get';
      const fields: FormField[] = [];

      // Extract input fields
      form.find('input, select, textarea').each((_, fieldElement) => {
        const field = $(fieldElement);
        const name = field.attr('name');
        
        if (!name || ['submit', 'button', 'reset', 'image'].includes(field.attr('type') || '')) {
          return; // Skip these fields
        }

        const type = field.attr('type') || field.prop('tagName')?.toLowerCase() || 'text';
        const label = findLabelForField($, field, name);
        const placeholder = field.attr('placeholder');
        const required = field.attr('required') !== undefined;

        fields.push({
          name,
          type,
          label,
          placeholder,
          required,
        });
      });

      if (fields.length > 0) {
        forms.push({
          url: resolveUrl(url, action),
          action,
          method,
          fields,
        });
      }
    });

    return forms;
  } catch (error: any) {
    console.error('Form detection error:', error.message);
    throw new Error(`Failed to detect forms: ${error.message}`);
  }
};

const findLabelForField = ($: cheerio.CheerioAPI, field: any, name: string): string | undefined => {
  // Try to find label by 'for' attribute
  const id = field.attr('id');
  if (id) {
    const label = $(`label[for="${id}"]`).text().trim();
    if (label) return label;
  }

  // Try to find parent label
  const parentLabel = field.closest('label').text().trim();
  if (parentLabel) return parentLabel;

  // Try to find label by name
  const labelByName = $(`label:contains("${name}")`).first().text().trim();
  if (labelByName) return labelByName;

  return undefined;
};

const resolveUrl = (baseUrl: string, relativePath: string): string => {
  if (!relativePath) return baseUrl;
  
  try {
    const url = new URL(relativePath, baseUrl);
    return url.href;
  } catch {
    return baseUrl;
  }
};

export const extractFormFromHtml = (html: string, baseUrl: string): DetectedForm[] => {
  const $ = cheerio.load(html);
  const forms: DetectedForm[] = [];

  $('form').each((index, element) => {
    const form = $(element);
    const action = form.attr('action') || '';
    const method = form.attr('method') || 'get';
    const fields: FormField[] = [];

    form.find('input, select, textarea').each((_, fieldElement) => {
      const field = $(fieldElement);
      const name = field.attr('name');
      
      if (!name || ['submit', 'button', 'reset', 'image'].includes(field.attr('type') || '')) {
        return;
      }

      const type = field.attr('type') || field.prop('tagName')?.toLowerCase() || 'text';
      const label = findLabelForField($, field, name);
      const placeholder = field.attr('placeholder');
      const required = field.attr('required') !== undefined;

      fields.push({
        name,
        type,
        label,
        placeholder,
        required,
      });
    });

    if (fields.length > 0) {
      forms.push({
        url: resolveUrl(baseUrl, action),
        action,
        method,
        fields,
      });
    }
  });

  return forms;
};
