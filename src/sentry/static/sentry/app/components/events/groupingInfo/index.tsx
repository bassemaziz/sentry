import React from 'react';
import styled from '@emotion/styled';

import {Client} from 'app/api';
import AsyncComponent from 'app/components/asyncComponent';
import EventDataSection from 'app/components/events/eventDataSection';
import {t} from 'app/locale';
import withOrganization from 'app/utils/withOrganization';
import {Organization, Event, EventGroupInfo} from 'app/types';
import space from 'app/styles/space';
import Button from 'app/components/button';
import LoadingIndicator from 'app/components/loadingIndicator';

import GroupVariant from './groupingVariant';
import GroupingConfigSelect from './groupingConfigSelect';

type Props = AsyncComponent['props'] & {
  api: Client;
  organization: Organization;
  projectId: string;
  event: Event;
  showSelector: boolean;
};

type State = AsyncComponent['state'] & {
  isOpen: boolean;
  configOverride: string | null;
  groupInfo: EventGroupInfo;
};

class EventGroupingInfo extends AsyncComponent<Props, State> {
  getEndpoints(): ReturnType<AsyncComponent['getEndpoints']> {
    const {organization, event, projectId} = this.props;

    let path = `/projects/${organization.slug}/${projectId}/events/${event.id}/grouping-info/`;
    if (this.state?.configOverride) {
      path = `${path}?config=${this.state.configOverride}`;
    }

    return [['groupInfo', path]];
  }

  getDefaultState() {
    return {
      ...super.getDefaultState(),
      isOpen: false,
      configOverride: null,
    };
  }

  toggle = () => {
    this.setState(state => ({
      isOpen: !state.isOpen,
      configOverride: state.isOpen ? null : state.configOverride,
    }));
  };

  handleConfigSelect = selection => {
    this.setState({configOverride: selection.value}, () => this.reloadData());
  };

  renderGroupInfoSummary() {
    const {groupInfo} = this.state;

    if (groupInfo === null) {
      return null;
    }

    const groupedBy = Object.values(groupInfo)
      .filter(variant => variant.hash !== null)
      .map(variant => variant.description)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .join(', ');

    return <small>{`(${t('grouped by')} ${groupedBy || t('nothing')})`}</small>;
  }

  renderGroupConfigSelect() {
    const {configOverride} = this.state;
    const {event} = this.props;

    const configId = configOverride ?? event.groupingConfig.id;

    return (
      <GroupConfigWrapper>
        <GroupingConfigSelect
          eventConfigId={event.groupingConfig.id}
          configId={configId}
          onSelect={this.handleConfigSelect}
        />
      </GroupConfigWrapper>
    );
  }

  renderGroupInfo() {
    const {groupInfo, loading} = this.state;
    const {showSelector} = this.props;

    const variants = Object.values(groupInfo).sort((a, b) =>
      a.hash && !b.hash
        ? -1
        : a.description.toLowerCase().localeCompare(b.description.toLowerCase())
    );

    return (
      <GroupVariantList>
        {showSelector && this.renderGroupConfigSelect()}

        {loading ? (
          <LoadingIndicator />
        ) : (
          variants.map(variant => <GroupVariant variant={variant} key={variant.key} />)
        )}
      </GroupVariantList>
    );
  }

  renderLoading() {
    return this.renderBody();
  }

  renderBody() {
    const {isOpen} = this.state;

    const title = (
      <React.Fragment>
        {t('Event Grouping Information')}
        {!isOpen && this.renderGroupInfoSummary()}
      </React.Fragment>
    );

    const actions = (
      <ToggleButton onClick={this.toggle} priority="link">
        {isOpen ? t('Hide Details') : t('Show Details')}
      </ToggleButton>
    );

    return (
      <EventDataSection type="grouping-info" title={title} actions={actions}>
        {isOpen && this.renderGroupInfo()}
      </EventDataSection>
    );
  }
}

export const GroupingConfigItem = styled('span')<{
  isHidden?: boolean;
  isActive?: boolean;
}>`
  font-family: ${p => p.theme.text.familyMono};
  opacity: ${p => (p.isHidden ? 0.5 : null)};
  font-weight: ${p => (p.isActive ? 'bold' : null)};
`;

const GroupVariantList = styled('ul')`
  padding: 0;
  margin: 0;
  list-style: none;
  font-size: ${p => p.theme.fontSizeMedium};
  line-height: 18px;
`;

const ToggleButton = styled(Button)`
  font-weight: 700;
  color: ${p => p.theme.gray3};
  &:hover,
  &:focus {
    color: ${p => p.theme.gray4};
  }
`;

const GroupConfigWrapper = styled('div')`
  margin-bottom: ${space(1.5)};
  margin-top: -${space(1)};
`;

export default withOrganization(EventGroupingInfo);
