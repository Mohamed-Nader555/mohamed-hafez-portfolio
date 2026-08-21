import { roles } from '@/data/roles';
import { roleHref } from '@/lib/content/role-query';
import type { RoleId } from '@/types/content';

type RecruiterLensSwitcherProps = {
  activeRole: RoleId;
};

export function RecruiterLensSwitcher({
  activeRole,
}: RecruiterLensSwitcherProps) {
  return (
    <ul className="lens-list">
      {roles.map((role) => {
        const isActive = role.id === activeRole;

        return (
          <li className="lens-item" key={role.id}>
            <a
              aria-current={isActive ? 'page' : undefined}
              aria-label={role.label}
              className={`lens-link${role.id === 'aiml' ? ' lens-link--ai' : ''}`}
              data-astro-reload=""
              data-lens={role.id}
              href={roleHref(role.id)}
            >
              {role.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
