import * as React from 'react';
import {withRouter, WithRouterProps} from 'react-router';
import partition from 'lodash/partition';

import ConfigStore from 'app/stores/configStore';
import {Organization, Project} from 'app/types';
import withOrganization from 'app/utils/withOrganization';
import withProjectsSpecified from 'app/utils/withProjectsSpecified';

import GlobalSelectionHeader from './globalSelectionHeader';
import InitializeGlobalSelectionHeader from './initializeGlobalSelectionHeader';

type GlobalSelectionHeaderProps = Omit<
  React.ComponentPropsWithoutRef<typeof GlobalSelectionHeader>,
  'router' | 'nonMemberProjects' | 'memberProjects' | 'selection'
>;

type Props = {
  organization: Organization;
  projects: Project[];
} & WithRouterProps &
  GlobalSelectionHeaderProps &
  Partial<
    Pick<React.ComponentProps<typeof InitializeGlobalSelectionHeader>, 'skipLoadLastUsed'>
  >;

class GlobalSelectionHeaderContainer extends React.Component<Props> {
  getProjects = () => {
    const {organization, projects} = this.props;
    const {isSuperuser} = ConfigStore.get('user');
    const isOrgAdmin = organization.access.includes('org:admin');

    const [memberProjects, nonMemberProjects] = partition(
      projects,
      project => project.isMember
    );

    if (isSuperuser || isOrgAdmin) {
      return [memberProjects, nonMemberProjects];
    }

    return [memberProjects, []];
  };

  render() {
    const {
      loadingProjects,
      location,
      organization,
      router,
      routes,

      defaultSelection,
      forceProject,
      shouldForceProject,
      skipLoadLastUsed,
      showAbsolute,
      ...props
    } = this.props;
    const enforceSingleProject = !organization.features.includes('global-views');
    const [memberProjects, nonMemberProjects] = this.getProjects();

    // We can initialize before ProjectsStore is fully loaded if we don't need to enforce single project.
    return (
      <React.Fragment>
        {(!loadingProjects || (!shouldForceProject && !enforceSingleProject)) && (
          <InitializeGlobalSelectionHeader
            location={location}
            skipLoadLastUsed={!!skipLoadLastUsed}
            router={router}
            organization={organization}
            defaultSelection={defaultSelection}
            forceProject={forceProject}
            shouldForceProject={!!shouldForceProject}
            shouldEnforceSingleProject={enforceSingleProject}
            memberProjects={memberProjects}
            showAbsolute={showAbsolute}
          />
        )}
        <GlobalSelectionHeader
          {...props}
          loadingProjects={loadingProjects}
          location={location}
          organization={organization}
          router={router}
          routes={routes}
          shouldForceProject={!!shouldForceProject}
          defaultSelection={defaultSelection}
          forceProject={forceProject}
          memberProjects={memberProjects}
          nonMemberProjects={nonMemberProjects}
          showAbsolute={showAbsolute}
        />
      </React.Fragment>
    );
  }
}

export default withOrganization(
  withProjectsSpecified(withRouter(GlobalSelectionHeaderContainer))
);
