/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@qwen-code/qwen-code-core';
import type { AuthMethod } from '@agentclientprotocol/sdk';

export function buildAuthMethods(): AuthMethod[] {
  return [
    {
      id: AuthType.USE_OPENAI,
      name: 'Use OpenAI API key',
      description: 'Requires setting the `OPENAI_API_KEY` environment variable',
      _meta: {
        type: 'terminal',
        args: ['--auth-type=openai'],
      },
    },
    {
      id: AuthType.USE_LOCAL_NEXUS,
      name: 'Localhost-Nexus-Redirect',
      description:
        'Fully local sovereign inference — ollama-compatible endpoint at http://localhost:11434/v1. No API key required.',
      _meta: {
        type: 'terminal',
        args: ['--auth-type=localhost-nexus-redirect'],
      },
    },
  ];
}

export function filterAuthMethodsById(
  authMethods: AuthMethod[],
  authMethodId: string,
): AuthMethod[] {
  return authMethods.filter((method) => method.id === authMethodId);
}

export function pickAuthMethodsForDetails(details?: string): AuthMethod[] {
  const authMethods = buildAuthMethods();
  if (!details) {
    return authMethods;
  }
  if (
    details.includes('localhost-nexus-redirect') ||
    details.includes('Localhost-Nexus-Redirect')
  ) {
    const narrowed = filterAuthMethodsById(
      authMethods,
      AuthType.USE_LOCAL_NEXUS,
    );
    return narrowed.length ? narrowed : authMethods;
  }
  return authMethods;
}
