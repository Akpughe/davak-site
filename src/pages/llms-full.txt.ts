import type { APIRoute } from 'astro';
import { llmsText } from '../lib/llms';

export const GET: APIRoute = () => llmsText(true);
