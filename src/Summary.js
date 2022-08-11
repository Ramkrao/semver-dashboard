import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import Pdf from 'react-to-pdf'

import { AnzRow,AnzCol,AnzGrid } from '@anz/grid'
import Button from '@anz/button'
import Text from '@anz/text'
import Section from '@anz/section'
import Table from '@anz/table'
import Bubble from '@anz/bubble'

import {BuildEstimatesByTimeperiod,
  GetStatusType,
  GetOutlineColor} from './CapacityCalculator'
import {PDF_OPTIONS, SYSTEMS} from './Constants'

const Summary = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // duummy count variable to invoke useEffect for navigation
  // TODO: find a better way to navigate back than using useEffect
  const [count, setCount] = useState(0);
  useEffect(() => {
    // quite a poor logic to conditionally redirect
    if (count > 0)
      navigate('/');
  })

  // create Pdf
  const summary = React.createRef();

  return(
  <div ref={summary}>
    <AnzGrid maxWidth='auto' fluid>
      <AnzRow>
        <AnzCol xs={12}>
          <div style={{"margin": "16px 0"}}>
            <Section>
              <Text heading>Summary - Application Versions</Text>
            </Section>
          </div>
          <div style={{"margin": "16px 0"}}>
            <Section>
              <Text heading="2">Capacity Estimates Summary</Text>
              <AnzRow style={{"marginTop": "32px"}}>
                <AnzCol xs={12} md={2} center="xs" />
                {SYSTEMS.map((system) => (
                  <AnzCol xs={12} md={2} key={system}>
                     <Text heading="2">{system}</Text>
                  </AnzCol>
                ))}
              </AnzRow>
              {/* {BuildEstimatesByTimeperiod(location.state).map((period) => (
                <div key={period.key}>
                  <AnzRow key={period.key} style={{"marginTop": "32px"}}>
                    <AnzCol xs={12} md={2} center="xs">
                      <Text heading="4">Time Period - {period.key}</Text>
                    </AnzCol>
                    {period.value.map((e) => (
                      <AnzCol xs={12} md={2} key={e.key}>
                        <Bubble
                          id={e.key}
                          percentage={e.value}
                          bubbleText={e.value.toString()}
                          label={e.label}
                          bubbleSize={125}
                          labelPosition='top'
                          statusType={GetStatusType(e.value)}
                          statusText={e.value+'% Increase'}
                          outLineColor={GetOutlineColor(e.value)}
                        />
                      </AnzCol>
                    ))}
                  </AnzRow>
                </div>
              ))} */}
            </Section>
            <AnzRow style={{"marginTop": "32px"}}>
              <AnzCol xs={12} md={3}>
                <Button type='submit' appearance='primary' fullWidth onClick={() => setCount(count+1)}>Go back Home</Button>
              </AnzCol>
            </AnzRow>
          </div>
        </AnzCol>
      </AnzRow>
    </AnzGrid>
  </div>
);
}

export default Summary
